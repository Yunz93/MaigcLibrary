import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Matter from 'matter-js';

type Dot = {
  id: string;
  color: 'yellow' | 'red' | 'blue' | 'white';
  x: number;
  y: number;
  size: number;
};

const COLORS = {
  yellow: '#FFD13B',
  red: '#E93D44',
  blue: '#0064A6',
  white: '#FFFFFF'
};

const SCENES = [
  { text: "准备好了吗？按一下这个黄点。" }, // 0
  { text: "太棒了！再按一下右边的黄点。" }, // 1
  { text: "完美。现在，轻轻摩擦左边的点。" }, // 2
  { text: "干得好！现在摩擦右边的点。" }, // 3
  { text: "太棒了！现在，在中间的黄点上快速按五下。" }, // 4
  { text: "现在，在红点上按五下。" }, // 5
  { text: "最后，在蓝点上按五下。" }, // 6
  { text: "太棒了！现在，摇晃设备！" }, // 7
  { text: "用力摇！" }, // 8
  { text: "向左倾斜！" }, // 9
  { text: "很好，现在把它摆正。" }, // 10 (Transition)
  { text: "向右倾斜！" }, // 11
  { text: "点一下屏幕，把灯关掉。" }, // 12
  { text: "点一下屏幕开灯。" }, // 13
  { text: "拍拍手！" }, // 14
  { text: "再拍一次！" }, // 15
  { text: "现在，对着屏幕吹气！" }, // 16
  { text: "太好玩了！再吹两次！" }, // 17
  { text: "大声喊：变色！" }, // 18
  { text: "点一下中间，让它们排好队。" }, // 19
  { text: "太大了！快按中间的白点！" } // 20
];

const initialDots: Dot[] = [
  { id: '1', color: 'yellow', x: 50, y: 50, size: 80 }
];

interface DotGameProps {
  onBack: () => void;
}

export default function DotGame({ onBack }: DotGameProps) {
  const [started, setStarted] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [scene, setScene] = useState(0);
  const [dots, setDots] = useState<Dot[]>(initialDots);
  const [tapCount, setTapCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [micError, setMicError] = useState(false);
  
  const rubRefs = useRef<Record<string, number>>({});
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const dotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const lastActionTimeRef = useRef<number>(0);
  const blowCountRef = useRef<number>(0);

  const playTapSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    
    // Soft pop sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  };

  const speak = (text: string) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        (v.lang.includes('zh') || v.lang.includes('CN')) && 
        (v.name.includes('Xiaoxiao') || v.name.includes('Meijia') || v.name.includes('Female') || v.name.includes('Huihui') || v.name.includes('Google'))
      );
      if (femaleVoice) utterance.voice = femaleVoice;
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = setVoice;
    } else {
      setVoice();
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const requestAccess = async () => {
    if (typeof (window as any).DeviceOrientationEvent !== 'undefined' && typeof (window as any).DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await (window as any).DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') setPermissionGranted(true);
      } catch (error) {
        console.error(error);
      }
    } else {
      setPermissionGranted(true);
    }
    setStarted(true);
    speak(SCENES[0].text);
  };

  const advanceScene = () => {
    if (scene < SCENES.length - 1) {
      const nextScene = scene + 1;
      setScene(nextScene);
      setTapCount(0);
      speak(SCENES[nextScene].text);
    } else {
      setIsFinished(true);
      speak("你真的太棒了！你是一个魔法小天才！我们下次再玩吧！");
    }
  };

  const startPhysics = () => {
    if (engineRef.current) return;
    const engine = Matter.Engine.create();
    engineRef.current = engine;
    const runner = Matter.Runner.create();
    runnerRef.current = runner;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const thickness = 100;

    Matter.World.add(engine.world, [
      Matter.Bodies.rectangle(w/2, -thickness/2, w, thickness, { isStatic: true }),
      Matter.Bodies.rectangle(w/2, h + thickness/2, w, thickness, { isStatic: true }),
      Matter.Bodies.rectangle(-thickness/2, h/2, thickness, h, { isStatic: true }),
      Matter.Bodies.rectangle(w + thickness/2, h/2, thickness, h, { isStatic: true }),
    ]);

    dots.forEach(dot => {
      const px = (dot.x / 100) * w;
      const py = (dot.y / 100) * h;
      const body = Matter.Bodies.circle(px, py, dot.size / 2, {
        restitution: 0.8,
        friction: 0.1,
        frictionAir: 0.02,
        density: 0.01
      });
      body.label = dot.id;
      Matter.World.add(engine.world, body);
    });

    Matter.Runner.run(runner, engine);

    Matter.Events.on(engine, 'afterUpdate', () => {
      engine.world.bodies.forEach(body => {
        if (body.isStatic) return;
        const el = dotRefs.current[body.label];
        if (el instanceof HTMLElement) {
          el.style.left = `${body.position.x}px`;
          el.style.top = `${body.position.y}px`;
        }
      });
    });
  };

  const stopPhysics = () => {
    if (engineRef.current && runnerRef.current) {
      Matter.Runner.stop(runnerRef.current);
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      const newDots = dots.map(dot => {
        const body = engineRef.current!.world.bodies.find(b => b.label === dot.id);
        if (body) {
          return { ...dot, x: (body.position.x / w) * 100, y: (body.position.y / h) * 100 };
        }
        return dot;
      });
      setDots(newDots);
      
      Object.values(dotRefs.current).forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.left = '';
          el.style.top = '';
        }
      });

      Matter.Engine.clear(engineRef.current);
      engineRef.current = null;
      runnerRef.current = null;
    }
  };

  useEffect(() => {
    if (scene >= 7 && scene <= 11 || scene === 16 || scene === 17) {
      startPhysics();
    } else {
      stopPhysics();
    }
  }, [scene]);

  const handleClap = () => {
    if (scene === 14) {
      setDots(prev => prev.map(d => ({ ...d, size: d.size * 1.5 })));
      advanceScene();
    } else if (scene === 15) {
      setDots(prev => {
        const newDots = prev.map(d => ({ ...d, size: d.size * 1.5 }));
        if (!newDots.find(d => d.id === 'white')) {
          newDots.push({ id: 'white', color: 'white', x: 50, y: 50, size: 80 });
        }
        return newDots;
      });
      advanceScene();
    }
  };

  const handleBlow = () => {
    if (engineRef.current) {
      engineRef.current.world.bodies.forEach(body => {
        if (!body.isStatic) {
          Matter.Body.applyForce(body, body.position, {
            x: (Math.random() - 0.5) * 0.2 * body.mass,
            y: -0.2 * body.mass
          });
        }
      });
    }
    
    if (scene === 16) {
      advanceScene();
    } else if (scene === 17) {
      blowCountRef.current += 1;
      if (blowCountRef.current >= 2) {
        advanceScene();
        blowCountRef.current = 0;
      }
    }
  };

  const handleShout = () => {
    const colors: ('yellow' | 'red' | 'blue')[] = ['yellow', 'red', 'blue'];
    setDots(prev => prev.map(d => d.id === 'white' ? d : ({
      ...d,
      color: colors[Math.floor(Math.random() * colors.length)]
    })));
    advanceScene();
  };

  const simulateShake = () => {
    if (engineRef.current) {
      engineRef.current.world.bodies.forEach(body => {
        if (!body.isStatic) {
          Matter.Body.applyForce(body, body.position, {
            x: (Math.random() - 0.5) * 0.1 * body.mass,
            y: (Math.random() - 0.5) * 0.1 * body.mass
          });
        }
      });
    }
    if (scene === 7) advanceScene();
    if (scene === 8) advanceScene();
  };

  const simulateTilt = (gamma: number) => {
    if (engineRef.current) {
      engineRef.current.world.gravity.x = gamma / 30;
    }
    if (scene === 9 && gamma < -35) advanceScene();
    if (scene === 10 && Math.abs(gamma) < 5) advanceScene();
    if (scene === 11 && gamma > 35) advanceScene();
  };

  useEffect(() => {
    let animationFrame: number;
    const startMic = async () => {
      try {
        if (!micStreamRef.current) {
          micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        if (!analyserRef.current) {
          const source = ctx.createMediaStreamSource(micStreamRef.current);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;
        }
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
          const average = sum / bufferLength;
          setMicLevel(average);
          const now = Date.now();
          if (scene === 14 || scene === 15) {
            if (average > 60 && now - lastActionTimeRef.current > 1000) {
              lastActionTimeRef.current = now;
              handleClap();
            }
          } else if (scene === 16 || scene === 17) {
            if (average > 30 && now - lastActionTimeRef.current > 800) {
              lastActionTimeRef.current = now;
              handleBlow();
            }
          } else if (scene === 18) {
            if (average > 60 && now - lastActionTimeRef.current > 1000) {
              lastActionTimeRef.current = now;
              handleShout();
            }
          }
          animationFrame = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      } catch (err) {
        console.error("Mic access denied or error:", err);
        setMicError(true);
      }
    };
    const micScenes = [14, 15, 16, 17, 18];
    if (micScenes.includes(scene)) {
      startMic();
    } else {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
        analyserRef.current = null;
      }
    }
    return () => { if (animationFrame) cancelAnimationFrame(animationFrame); };
  }, [scene]);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const { gamma, beta } = e;
      if (gamma === null || beta === null) return;
      if (engineRef.current) {
        const gravity = engineRef.current.world.gravity;
        gravity.x = gamma / 30; 
        gravity.y = beta / 30;
      }
      if (scene === 9 && gamma < -35) advanceScene();
      if (scene === 10 && Math.abs(gamma) < 5) advanceScene();
      if (scene === 11 && gamma > 35) advanceScene();
    };
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.acceleration;
      if (!acc) return;
      const total = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
      if (total > 15) {
        if (engineRef.current) {
          engineRef.current.world.bodies.forEach(body => {
            if (!body.isStatic) {
              Matter.Body.applyForce(body, body.position, {
                x: (Math.random() - 0.5) * 0.1 * body.mass,
                y: (Math.random() - 0.5) * 0.1 * body.mass
              });
            }
          });
        }
        if (scene === 7) advanceScene();
        if (scene === 8 && total > 25) advanceScene();
      }
    };
    if (permissionGranted && started) {
      window.addEventListener('deviceorientation', handleOrientation);
      window.addEventListener('devicemotion', handleMotion);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [scene, permissionGranted, started]);

  const handleDotClick = (id: string) => {
    playTapSound();
    if (scene === 0 && id === '1') {
      setDots([
        { id: '1', color: 'yellow', x: 35, y: 50, size: 80 },
        { id: '2', color: 'yellow', x: 65, y: 50, size: 80 }
      ]);
      advanceScene();
    } else if (scene === 1 && id === '2') {
      setDots([
        { id: '1', color: 'yellow', x: 20, y: 50, size: 80 },
        { id: '2', color: 'yellow', x: 50, y: 50, size: 80 },
        { id: '3', color: 'yellow', x: 80, y: 50, size: 80 }
      ]);
      advanceScene();
    } else if (scene === 4 && id === '2') {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount >= 5) {
        const newDots = [...dots.filter(d => d.id !== '2')];
        for (let i = 0; i < 5; i++) {
          newDots.push({ id: `y_${i}`, color: 'yellow', x: 50, y: 30 + i * 10, size: 60 });
        }
        setDots(newDots);
        advanceScene();
      }
    } else if (scene === 5 && id === '1') {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount >= 5) {
        const newDots = [...dots.filter(d => d.id !== '1')];
        for (let i = 0; i < 5; i++) {
          newDots.push({ id: `r_${i}`, color: 'red', x: 20, y: 30 + i * 10, size: 60 });
        }
        setDots(newDots);
        advanceScene();
      }
    } else if (scene === 6 && id === '3') {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount >= 5) {
        const newDots = [...dots.filter(d => d.id !== '3')];
        for (let i = 0; i < 5; i++) {
          newDots.push({ id: `b_${i}`, color: 'blue', x: 80, y: 30 + i * 10, size: 60 });
        }
        setDots(newDots);
        advanceScene();
      }
    } else if (scene === 20 && id === 'white') {
      advanceScene();
    }
  };

  const handleDotPointerMove = (id: string) => {
    if (scene === 2 && id === '1') {
      rubRefs.current[id] = (rubRefs.current[id] || 0) + 1;
      if (rubRefs.current[id] > 15) {
        setDots(dots.map(d => d.id === '1' ? { ...d, color: 'red' } : d));
        advanceScene();
        rubRefs.current = {};
      }
    } else if (scene === 3 && id === '3') {
      rubRefs.current[id] = (rubRefs.current[id] || 0) + 1;
      if (rubRefs.current[id] > 15) {
        setDots(dots.map(d => d.id === '3' ? { ...d, color: 'blue' } : d));
        advanceScene();
        rubRefs.current = {};
      }
    }
  };

  const handleScreenClick = (e: React.MouseEvent) => {
    playTapSound();
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    if (scene === 7 || scene === 8) {
      if (clientY < innerHeight / 3) {
        if (engineRef.current) {
          engineRef.current.world.bodies.forEach(body => {
            if (!body.isStatic) {
              Matter.Body.applyForce(body, body.position, {
                x: (Math.random() - 0.5) * 0.1 * body.mass,
                y: (Math.random() - 0.5) * 0.1 * body.mass
              });
            }
          });
        }
        advanceScene();
      }
    } else if (scene === 9 && clientX < innerWidth / 3) {
      if (engineRef.current) engineRef.current.world.gravity.x = -2;
      advanceScene();
    } else if (scene === 10) {
      if (engineRef.current) engineRef.current.world.gravity.x = 0;
      advanceScene();
    } else if (scene === 11 && clientX > (innerWidth * 2) / 3) {
      if (engineRef.current) engineRef.current.world.gravity.x = 2;
      advanceScene();
    } else if (scene === 12) {
      advanceScene();
    } else if (scene === 13) {
      advanceScene();
    } else if (scene === 14) {
      setDots(dots.map(d => ({ ...d, size: d.size * 1.5 })));
      advanceScene();
    } else if (scene === 15) {
      const newDots = dots.map(d => ({ ...d, size: d.size * 1.5 }));
      newDots.push({ id: 'white', color: 'white', x: 50, y: 50, size: 80 });
      setDots(newDots);
      advanceScene();
    } else if (scene === 16 || scene === 17) {
      advanceScene();
    } else if (scene === 18) {
      advanceScene();
    } else if (scene === 19) {
      setDots(prev => {
        const newDots: Dot[] = [
          { id: '1', color: 'red', x: 20, y: 50, size: 120 },
          { id: '2', color: 'yellow', x: 50, y: 50, size: 120 },
          { id: '3', color: 'blue', x: 80, y: 50, size: 120 }
        ];
        if (prev.find(d => d.id === 'white')) {
          newDots.push({ id: 'white', color: 'white', x: 50, y: 50, size: 60 });
        }
        return newDots;
      });
      advanceScene();
    }
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F9F9] text-gray-800 font-sans p-6 text-center">
        <button onClick={onBack} className="absolute top-8 left-8 p-2 text-gray-400 hover:text-gray-600 transition-colors">← 返回图书馆</button>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 tracking-wider">点，点，点</h1>
        <p className="text-lg md:text-xl mb-12 max-w-md text-gray-600 leading-relaxed">
          这是一个互动绘本小游戏。<br/>你需要根据提示点击、摩擦屏幕，甚至倾斜和摇晃你的设备！
        </p>
        <button
          onClick={requestAccess}
          className="px-10 py-4 bg-[#FFD13B] text-black font-bold rounded-full text-2xl shadow-lg hover:scale-105 transition-transform active:scale-95 cursor-pointer"
        >
          开始游戏
        </button>
        <p className="mt-12 text-sm text-gray-400 max-w-sm">
          * 建议在手机或平板上体验以获得最佳效果。<br/>
          * 我们会使用语音为您的小朋友介绍玩法。
        </p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F9F9] text-gray-800 font-sans p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-8">🌟</motion.div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 tracking-wider">太棒了！</h1>
        <p className="text-2xl md:text-3xl mb-12 max-w-md text-gray-600 leading-relaxed">你真是个魔法小天才！<br/>所有的点点都为你感到骄傲！</p>
        <div className="flex gap-4">
          <button
            onClick={() => { setIsFinished(false); setScene(0); setDots(initialDots); speak(SCENES[0].text); }}
            className="px-8 py-3 bg-[#FFD13B] text-black font-bold rounded-full text-xl shadow-md hover:scale-105 transition-transform active:scale-95 cursor-pointer"
          >
            再玩一次
          </button>
          <button
            onClick={onBack}
            className="px-8 py-3 bg-white border-2 border-[#FFD13B] text-black font-bold rounded-full text-xl shadow-md hover:scale-105 transition-transform active:scale-95 cursor-pointer"
          >
            返回图书馆
          </button>
        </div>
      </div>
    );
  }

  const isDark = scene === 13;
  const isPhysics = scene >= 7 && scene <= 11 || scene === 16 || scene === 17;

  return (
    <div
      className="relative w-full h-screen overflow-hidden touch-none select-none transition-colors duration-700"
      style={{ backgroundColor: isDark ? '#000000' : '#F9F9F9' }}
      onClick={handleScreenClick}
    >
      <button onClick={onBack} className="absolute top-8 left-8 p-2 z-20 text-gray-400 hover:text-gray-600 transition-colors" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>← 退出</button>
      
      <div className="absolute top-16 left-0 w-full px-6 text-center pointer-events-none z-10">
        <AnimatePresence mode="wait">
          <motion.h2
            key={scene}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="text-2xl md:text-4xl font-medium tracking-wide transition-colors duration-700"
            style={{ color: isDark ? '#FFFFFF' : '#1F2937' }}
          >
            {SCENES[scene].text}
          </motion.h2>
        </AnimatePresence>
        
        {micError && [14, 15, 16, 17, 18].includes(scene) && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm md:text-base text-red-500 bg-white/80 backdrop-blur-sm inline-block px-4 py-2 rounded-full shadow-sm pointer-events-auto">
            无法访问麦克风，请直接点击屏幕过关，或使用右上角模拟器。
          </motion.p>
        )}
      </div>

      {dots.map(dot => (
        <div
          key={dot.id}
          ref={el => dotRefs.current[dot.id] = el}
          className="absolute rounded-full shadow-md cursor-pointer"
          style={{
            width: dot.size,
            height: dot.size,
            left: isPhysics ? 0 : `${dot.x}%`,
            top: isPhysics ? 0 : `${dot.y}%`,
            marginLeft: -dot.size / 2,
            marginTop: -dot.size / 2,
            touchAction: 'none',
            backgroundColor: COLORS[dot.color],
            transition: isPhysics ? 'none' : 'left 0.5s ease, top 0.5s ease, background-color 0.3s ease, width 0.5s ease, height 0.5s ease, margin 0.5s ease',
            zIndex: dot.color === 'white' ? 20 : 1
          }}
          onPointerDown={(e) => { e.stopPropagation(); handleDotClick(dot.id); }}
          onPointerMove={() => handleDotPointerMove(dot.id)}
        />
      ))}

      {isSpeaking && <div className="absolute bottom-8 right-8 text-2xl animate-bounce">🔊</div>}

      {started && (
        <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
          <button onClick={(e) => { e.stopPropagation(); setShowDebug(!showDebug); }} className="p-2 bg-white/50 backdrop-blur-sm rounded-full opacity-50 hover:opacity-100 shadow-sm transition-opacity">🛠️</button>
          {showDebug && (
            <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg flex flex-col gap-2 text-sm border border-gray-100" onClick={e => e.stopPropagation()}>
              <div className="text-xs font-bold text-gray-500 mb-1">物理模拟</div>
              <button className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors" onClick={simulateShake}>摇晃 (Shake)</button>
              <div className="flex gap-1">
                <button className="flex-1 px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors" onClick={() => simulateTilt(-40)}>左倾</button>
                <button className="flex-1 px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors" onClick={() => simulateTilt(0)}>摆正</button>
                <button className="flex-1 px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors" onClick={() => simulateTilt(40)}>右倾</button>
              </div>
              <div className="text-xs font-bold text-gray-500 mt-2 mb-1">声音模拟</div>
              <button className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors" onClick={handleClap}>拍手 (Clap)</button>
              <button className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors" onClick={handleBlow}>吹气 (Blow)</button>
              <button className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors" onClick={handleShout}>大喊 (Shout)</button>
              <div className="text-xs font-bold text-gray-500 mt-2 mb-1">流程控制</div>
              <button className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors" onClick={advanceScene}>强制跳关 (Next)</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
