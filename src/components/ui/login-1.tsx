'use client'

import * as React from 'react'
import { useState } from 'react'
import Image from 'next/image';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
}

const AppInput = (props: InputProps) => {
    const { label, icon, ...rest } = props;
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    return (
        <div className="w-full min-w-[200px] relative">
            {label &&
                <label className='block mb-2 text-sm'>
                    {label}
                </label>
            }
            <div className="relative w-full">
                <input
                    className="peer relative z-10 border-2 border-[var(--color-border)] h-13 w-full rounded-md bg-[var(--color-surface)] px-4 py-3 font-thin outline-none drop-shadow-sm transition-all duration-200 ease-in-out focus:bg-[var(--color-bg)] placeholder:font-medium text-[var(--color-text-primary)]"
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    {...rest}
                />
                {isHovering && (
                    <>
                        <div
                            className="absolute pointer-events-none top-0 left-0 right-0 h-[2px] z-20 rounded-t-md overflow-hidden"
                            style={{
                                background: `radial-gradient(30px circle at ${mousePosition.x}px 0px, var(--color-text-primary) 0%, transparent 70%)`,
                            }}
                        />
                        <div
                            className="absolute pointer-events-none bottom-0 left-0 right-0 h-[2px] z-20 rounded-b-md overflow-hidden"
                            style={{
                                background: `radial-gradient(30px circle at ${mousePosition.x}px 2px, var(--color-text-primary) 0%, transparent 70%)`,
                            }}
                        />
                    </>
                )}
                {icon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    )
}

const StartLoginOne = () => {
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    const electricalImages = [
        "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e", // Power lines
        "https://images.unsplash.com/photo-1542826671-50e5027b4070", // High voltage transmission tower
        "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9", // High voltage tower 2
        "https://images.unsplash.com/photo-1521292270410-a8c4d716d518", // Electric cables/infrastructure
    ];

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % electricalImages.length);
        }, 5000); // Change every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        const leftSection = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - leftSection.left,
            y: e.clientY - leftSection.top
        });
    };

    const handleMouseEnter = () => {
        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
    };



    return (
        <div className="h-screen w-[100%] bg-[var(--color-bg)] flex items-center justify-center p-4">
            <div className='w-[80%] lg:w-[70%] md:w-[55%] flex justify-between h-[600px] bg-[var(--color-surface)] rounded-xl shadow-2xl overflow-hidden'>
                <div
                    className='w-full lg:w-1/2 px-4 lg:px-16 left h-full relative overflow-hidden bg-[var(--color-surface)]'
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}>
                    <div
                        className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-purple-300/30 via-blue-300/30 to-pink-300/30 rounded-full blur-3xl transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0'
                            }`}
                        style={{
                            transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
                            transition: 'transform 0.1s ease-out'
                        }}
                    />
                    <div className="form-container sign-in-container h-full z-10 relative">
                        <form className='text-center py-6 grid gap-2 h-full content-center' onSubmit={(e) => { e.preventDefault(); }}>
                            <div className='grid gap-4 md:gap-6 mb-2 justify-items-center'>
                                <div className="relative h-32 w-32">
                                    <Image
                                        src="https://i.ibb.co/MFtSVtR/dmreLogo.png"
                                        alt="D.M.R.E Logo"
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-contain"
                                    />
                                </div>
                                <div className="mb-2">
                                    <span className="text-2xl font-bold tracking-[0.2em] text-[var(--color-text-primary)]">
                                        D.M.R.E
                                    </span>
                                </div>
                                <h1 className='text-3xl md:text-4xl font-extrabold text-[var(--color-heading)]'>Inicio de Sesión</h1>
                                <span className='text-sm text-[var(--color-text-secondary)]'>Usa tus credenciales para ingresar</span>
                            </div>
                            <div className='grid gap-4 items-center max-w-sm mx-auto w-full'>
                                <AppInput placeholder="Email" type="email" />
                                <AppInput placeholder="Password" type="password" />
                            </div>
                            <a href="#" className='font-light text-sm md:text-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mt-4 block'>¿Olvidaste tu contraseña?</a>
                            <div className='flex gap-4 justify-center items-center mt-6'>
                                <button
                                    className="group/button relative inline-flex justify-center items-center overflow-hidden rounded-md bg-[var(--color-border)] px-4 py-1.5 text-xs font-normal text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-[var(--color-text-primary)] cursor-pointer"
                                >
                                    <span className="text-sm px-6 py-2">Iniciar Sesión</span>
                                    <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                                        <div className="relative h-full w-8 bg-white/20" />
                                    </div>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                <div className='hidden lg:block w-1/2 right h-full overflow-hidden relative'>
                    {electricalImages.map((src, index) => (
                        <Image
                            key={src}
                            src={src}
                            fill
                            priority={index === 0}
                            alt={`Electrical theme ${index + 1}`}
                            className={`w-full h-full object-cover transition-opacity duration-1000 hover:scale-105 ${currentImageIndex === index ? 'opacity-60 z-10' : 'opacity-0 z-0'
                                } absolute inset-0`}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default StartLoginOne
