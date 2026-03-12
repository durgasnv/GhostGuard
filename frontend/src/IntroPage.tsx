import React, { useState } from 'react';
import './IntroPage.css';

interface IntroPageProps {
    onHunt: () => void;
}

const IntroPage: React.FC<IntroPageProps> = ({ onHunt }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleHuntClick = () => {
        setIsExiting(true);
        // Wait for the animation to finish before calling onHunt
        setTimeout(() => {
            onHunt();
        }, 800); // Should match CSS transition duration
    };

    return (
        <div className={`intro-container ${isExiting ? 'exit-up' : ''}`}>
            <div className="bg-text-overlay">GHOSTGUARD</div>
            <div className="intro-content">
                <div className="ghost-image-wrapper">
                    <img
                        src="/ghost_security.png"
                        alt="Ghost Guard Security"
                        className="ghost-image"
                    />
                </div>
                <button className="hunt-button" onClick={handleHuntClick}>
                    LET'S HUNT
                </button>
            </div>
        </div>
    );
};

export default IntroPage;
