import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, query, limit, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

// --- SVG Icons ---
const WalletIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
);

const SlotMachineIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
);

const BlackjackIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.382,2.618a2.25,2.25,0,0,0-3.182,0L2,18.818V21a1,1,0,0,0,1,1H5.182L21.382,5.8A2.25,2.25,0,0,0,21.382,2.618ZM11,18H8V15l3,3Zm3-3-8-8,3-3,8,8Z" />
    </svg>
);

const RouletteIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.53 15.53a5.25 5.25 0 0 1-7.06 0M19.07 19.07a8.25 8.25 0 1 1 0-11.668 8.25 8.25 0 0 1 0 11.668Z" />
    </svg>
);

const AiOracleIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 1-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 1 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 1 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 1-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);


// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "YOUR_API_KEY", // Replace with your actual config
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-casino-app';

// --- Components ---

// --- Cosmic Slots Game ---
const CosmicSlots = ({ balance, updateBalance }) => {
    const symbols = ['🪐', '🚀', '👽', '🌟', '💎', '🍒'];
    const [reels, setReels] = useState(['🪐', '🚀', '👽']);
    const [spinning, setSpinning] = useState(false);
    const [message, setMessage] = useState('Spin to win!');
    const betAmount = 10;

    const spin = () => {
        if (spinning || balance < betAmount) {
            setMessage(balance < betAmount ? "Not enough FUNds!" : "Reels are spinning!");
            return;
        }

        setSpinning(true);
        updateBalance(-betAmount);

        let spinCount = 0;
        const spinInterval = setInterval(() => {
            setReels(reels.map(() => symbols[Math.floor(Math.random() * symbols.length)]));
            spinCount++;
            if (spinCount > 20) {
                clearInterval(spinInterval);
                finishSpin();
            }
        }, 100);
    };

    const finishSpin = () => {
        const finalReels = [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
        ];
        setReels(finalReels);

        // Payout logic
        if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
            setMessage(`Jackpot! You won 100 FUNds!`);
            updateBalance(100);
        } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2]) {
            setMessage(`Nice! You won 20 FUNds!`);
            updateBalance(20);
        } else {
            setMessage('Try again!');
        }
        setSpinning(false);
    };

    return (
        <div className="text-center p-6 bg-purple-900/50 rounded-2xl shadow-lg border border-purple-400">
            <h2 className="text-3xl font-bold text-yellow-300 mb-4">Cosmic Slots</h2>
            <div className="flex justify-center items-center space-x-4 text-6xl my-8 p-4 bg-black/50 rounded-lg">
                {reels.map((symbol, index) => (
                    <div key={index} className={`p-4 transition-transform duration-300 ${spinning ? 'animate-bounce' : ''}`}>
                        {symbol}
                    </div>
                ))}
            </div>
            <button
                onClick={spin}
                disabled={spinning || balance < betAmount}
                className="w-full px-8 py-4 text-2xl font-bold text-gray-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-300 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
                {spinning ? 'Spinning...' : `Spin (10 FUNds)`}
            </button>
            <p className="mt-4 text-xl text-white font-semibold">{message}</p>
        </div>
    );
};

// --- Blackjack Game ---
const Blackjack = ({ balance, updateBalance }) => {
    const [gameState, setGameState] = useState('new'); // new, betting, player, dealer, end
    const [playerCards, setPlayerCards] = useState([]);
    const [dealerCards, setDealerCards] = useState([]);
    const [playerScore, setPlayerScore] = useState(0);
    const [dealerScore, setDealerScore] = useState(0);
    const [message, setMessage] = useState('');
    const [bet, setBet] = useState(10);
    const deck = useRef([]);

    const createDeck = () => {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let newDeck = [];
        for (let suit of suits) {
            for (let value of values) {
                newDeck.push({ suit, value });
            }
        }
        // Shuffle deck
        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        deck.current = newDeck;
    };
    
    const getCardValue = (card, currentScore) => {
        if (['J', 'Q', 'K'].includes(card.value)) return 10;
        if (card.value === 'A') return currentScore + 11 > 21 ? 1 : 11;
        return parseInt(card.value);
    };

    const calculateScore = (cards) => {
        let score = 0;
        let aces = 0;
        cards.forEach(card => {
            if (card.value === 'A') aces++;
            score += getCardValue(card, score);
        });
        while(score > 21 && aces > 0){
            score -= 10;
            aces--;
        }
        return score;
    };

    const deal = () => {
        if (balance < bet) {
            setMessage("Not enough FUNds to bet!");
            return;
        }
        updateBalance(-bet);
        createDeck();
        const playerHand = [deck.current.pop(), deck.current.pop()];
        const dealerHand = [deck.current.pop(), deck.current.pop()];

        setPlayerCards(playerHand);
        setDealerCards(dealerHand);
        setPlayerScore(calculateScore(playerHand));
        setDealerScore(calculateScore(dealerHand));
        setGameState('player');
        setMessage('Your turn. Hit or Stand?');

        if (calculateScore(playerHand) === 21) {
            setMessage('Blackjack! You win!');
            updateBalance(bet * 2.5);
            setGameState('end');
        }
    };
    
    const hit = () => {
        if (gameState !== 'player') return;
        const newCard = deck.current.pop();
        const newPlayerCards = [...playerCards, newCard];
        const newPlayerScore = calculateScore(newPlayerCards);
        setPlayerCards(newPlayerCards);
        setPlayerScore(newPlayerScore);

        if (newPlayerScore > 21) {
            setMessage('Bust! You lose.');
            setGameState('end');
        }
    };

    const stand = () => {
        if (gameState !== 'player') return;
        setGameState('dealer');
        let currentDealerCards = [...dealerCards];
        let currentDealerScore = calculateScore(currentDealerCards);

        const dealerPlay = () => {
             while(calculateScore(currentDealerCards) < 17){
                currentDealerCards.push(deck.current.pop());
             }
             const finalDealerScore = calculateScore(currentDealerCards);
             setDealerCards(currentDealerCards);
             setDealerScore(finalDealerScore);

             if (finalDealerScore > 21 || playerScore > finalDealerScore) {
                 setMessage(`You win! Dealer score: ${finalDealerScore}`);
                 updateBalance(bet * 2);
             } else if (playerScore < finalDealerScore) {
                 setMessage(`You lose. Dealer score: ${finalDealerScore}`);
             } else {
                 setMessage('Push. It\'s a tie.');
                 updateBalance(bet);
             }
             setGameState('end');
        };
        // Add a small delay for dramatic effect
        setTimeout(dealerPlay, 1000);
    };

    const resetGame = () => {
        setGameState('new');
        setPlayerCards([]);
        setDealerCards([]);
        setMessage('Place your bet to start a new game.');
    };

    const Card = ({ card, hidden }) => (
        <div className={`w-20 h-28 md:w-24 md:h-36 rounded-lg flex items-center justify-center text-3xl font-bold transition-all duration-500 ${hidden ? 'bg-red-800' : 'bg-white text-black'} ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : ''}`}>
           {hidden ? '?' : `${card.value}${card.suit}`}
        </div>
    );

    return (
        <div className="text-center p-4 md:p-6 bg-green-900/50 rounded-2xl shadow-lg border border-green-400">
            <h2 className="text-3xl font-bold text-yellow-300 mb-4">Blackjack Nebula</h2>
            
            {/* Dealer's Hand */}
            <div className="my-4">
                <h3 className="text-xl text-white">Dealer's Hand ({gameState === 'player' ? '?' : dealerScore})</h3>
                <div className="flex justify-center space-x-2 mt-2 min-h-[150px]">
                    {dealerCards.map((card, i) => (
                        <Card key={i} card={card} hidden={gameState === 'player' && i === 1} />
                    ))}
                </div>
            </div>

            {/* Player's Hand */}
            <div className="my-4">
                <h3 className="text-xl text-white">Your Hand ({playerScore})</h3>
                <div className="flex justify-center space-x-2 mt-2 min-h-[150px]">
                    {playerCards.map((card, i) => (
                        <Card key={i} card={card} />
                    ))}
                </div>
            </div>

            <p className="my-4 text-xl text-white font-semibold h-8">{message}</p>

            {gameState === 'new' && (
                <div className="flex flex-col items-center space-y-4">
                    <div className="flex items-center space-x-2">
                        <label htmlFor="bet" className="text-white">Bet:</label>
                        <input type="number" id="bet" value={bet} onChange={e => setBet(Math.max(1, parseInt(e.target.value) || 1))} className="w-24 bg-gray-800 text-white p-2 rounded" />
                    </div>
                    <button onClick={deal} className="w-full px-8 py-3 text-xl font-bold text-gray-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105">Deal</button>
                </div>
            )}

            {gameState === 'player' && (
                <div className="flex justify-center space-x-4">
                    <button onClick={hit} className="px-8 py-3 text-xl font-bold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-500 transition-all duration-300 transform hover:scale-105">Hit</button>
                    <button onClick={stand} className="px-8 py-3 text-xl font-bold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-500 transition-all duration-300 transform hover:scale-105">Stand</button>
                </div>
            )}
            
            {gameState === 'end' && (
                 <button onClick={resetGame} className="w-full px-8 py-3 text-xl font-bold text-gray-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105">Play Again</button>
            )}
        </div>
    );
};


// --- Roulette Game ---
const Roulette = ({ balance, updateBalance }) => {
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState(null);
    const [message, setMessage] = useState('Place your bets!');
    const [bets, setBets] = useState({});
    const [betAmount, setBetAmount] = useState(10);
    const wheelNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
    const numberColors = {};
    wheelNumbers.forEach((n, i) => {
        if (n === 0) numberColors[n] = 'green';
        else if ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n)) numberColors[n] = 'red';
        else numberColors[n] = 'black';
    });

    const placeBet = (betType) => {
        if (spinning) return;
        if (balance < betAmount) {
            setMessage("Not enough FUNds!");
            return;
        }
        
        const newBets = {...bets};
        newBets[betType] = (newBets[betType] || 0) + betAmount;
        setBets(newBets);
        updateBalance(-betAmount);
        setMessage(`${betAmount} FUNds bet on ${betType}`);
    };

    const spin = () => {
        if (spinning || Object.keys(bets).length === 0) {
            setMessage(Object.keys(bets).length === 0 ? "You must place a bet first!" : "Wheel is already spinning!");
            return;
        }
        setSpinning(true);
        setResult(null);
        
        const spinResult = wheelNumbers[Math.floor(Math.random() * wheelNumbers.length)];
        
        setTimeout(() => {
            setResult(spinResult);
            calculateWinnings(spinResult);
            setSpinning(false);
        }, 4000);
    };

    const calculateWinnings = (winningNumber) => {
        let winnings = 0;
        const color = numberColors[winningNumber];
        const isEven = winningNumber !== 0 && winningNumber % 2 === 0;
        const isOdd = winningNumber !== 0 && winningNumber % 2 !== 0;

        for (const betType in bets) {
            const betValue = bets[betType];
            if (betType == winningNumber) {
                winnings += betValue * 35;
            } else if (betType === 'red' && color === 'red') {
                winnings += betValue * 2;
            } else if (betType === 'black' && color === 'black') {
                winnings += betValue * 2;
            } else if (betType === 'even' && isEven) {
                winnings += betValue * 2;
            } else if (betType === 'odd' && isOdd) {
                winnings += betValue * 2;
            }
        }

        if (winnings > 0) {
            setMessage(`The number is ${winningNumber} (${color}). You won ${winnings} FUNds!`);
            updateBalance(winnings);
        } else {
            setMessage(`The number is ${winningNumber} (${color}). Better luck next time!`);
        }
        setBets({});
    };

    const BetButton = ({ bet, label, color }) => (
        <button onClick={() => placeBet(bet)} className={`p-2 rounded-md text-white font-bold ${color} transition-transform transform hover:scale-105 disabled:bg-gray-500`} disabled={spinning}>
            {label || bet}
            {bets[bet] && <span className="ml-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">{bets[bet]}</span>}
        </button>
    );

    return (
        <div className="text-center p-4 md:p-6 bg-red-900/50 rounded-2xl shadow-lg border border-red-400">
            <h2 className="text-3xl font-bold text-yellow-300 mb-4">Roulette Rings of Saturn</h2>

            <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto my-4 border-8 border-yellow-400 rounded-full">
                <div className={`w-full h-full rounded-full bg-gray-800 transition-transform duration-[4000ms] ease-out ${spinning ? 'animate-[spin_4s_ease-out_forwards]' : ''}`}>
                   {wheelNumbers.map((num, i) => (
                       <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${i * (360 / wheelNumbers.length)}deg)`}}>
                           <div className={`absolute top-0 left-1/2 -ml-4 w-8 text-center font-bold text-sm ${numberColors[num] === 'red' ? 'text-red-500' : numberColors[num] === 'black' ? 'text-gray-300' : 'text-green-500'}`}>{num}</div>
                       </div>
                   ))}
                </div>
                <div className="absolute top-0 left-1/2 -ml-1 w-2 h-4 bg-yellow-400 transform -translate-y-full"></div>
                {result !== null && !spinning && (
                    <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold" style={{color: numberColors[result]}}>
                        {result}
                    </div>
                )}
            </div>
            
            <p className="my-4 text-xl text-white font-semibold h-12">{message}</p>

            <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1">
                    {[...Array(12).keys()].map(i => i * 3 + 3).map(n => <BetButton key={n} bet={n} color={numberColors[n] === 'red' ? 'bg-red-600' : 'bg-black'} />)}
                    {[...Array(12).keys()].map(i => i * 3 + 2).map(n => <BetButton key={n} bet={n} color={numberColors[n] === 'red' ? 'bg-red-600' : 'bg-black'} />)}
                    {[...Array(12).keys()].map(i => i * 3 + 1).map(n => <BetButton key={n} bet={n} color={numberColors[n] === 'red' ? 'bg-red-600' : 'bg-black'} />)}
                </div>
                 <div className="grid grid-cols-4 gap-2">
                    <BetButton bet={0} color="bg-green-600 col-span-1" />
                    <BetButton bet="even" label="Even" color="bg-blue-600 col-span-1" />
                    <BetButton bet="odd" label="Odd" color="bg-blue-600 col-span-1" />
                    <BetButton bet="black" label="Black" color="bg-black col-span-1" />
                    <BetButton bet="red" label="Red" color="bg-red-600 col-span-1" />
                </div>
            </div>

            <div className="flex items-center justify-center space-x-2 my-4">
                <label htmlFor="roulette-bet" className="text-white">Bet Amount:</label>
                <input type="number" id="roulette-bet" value={betAmount} onChange={e => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))} className="w-24 bg-gray-800 text-white p-2 rounded" />
            </div>

            <button onClick={spin} disabled={spinning || Object.keys(bets).length === 0} className="w-full mt-4 px-8 py-3 text-xl font-bold text-gray-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600">
                Spin Wheel
            </button>
        </div>
    );
};

// --- AI Oracle ---
const AiOracle = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const getOracleResponse = async () => {
        if (!prompt || loading) return;
        setLoading(true);
        setResponse('');

        const fullPrompt = `You are the "Cosmo FUNd Oracle," a mystical, slightly unhinged AI entity in a space casino. A player asks you: "${prompt}". Give a short, cryptic, and fun prediction or piece of advice related to luck, fortune, or casino games. Keep it under 30 words. Be weird and entertaining.`;

        try {
            const apiKey = ""; // Leave empty, handled by environment
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{ role: "user", parts: [{ text: fullPrompt }] }]
            };
            const apiResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await apiResponse.json();
            
            if (result.candidates && result.candidates.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setResponse(text);
            } else {
                setResponse("The cosmos are silent... or maybe the Wi-Fi is down. Try again.");
            }
        } catch (error) {
            console.error("Error contacting the Oracle:", error);
            setResponse("The cosmic frequencies are jammed. Ask again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-indigo-900/50 rounded-2xl shadow-lg border border-indigo-400">
            <h2 className="text-3xl font-bold text-yellow-300 mb-4 text-center">The AI Oracle</h2>
            <p className="text-center text-indigo-200 mb-4">Ask the cosmos for guidance... if you dare.</p>
            <div className="flex space-x-2">
                <input 
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask a question about your fortune..."
                    className="flex-grow bg-gray-800 text-white p-3 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                />
                <button 
                    onClick={getOracleResponse}
                    disabled={loading}
                    className="px-6 py-3 font-bold text-gray-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-300 disabled:bg-gray-600 transition-colors"
                >
                    {loading ? 'Consulting...' : 'Ask'}
                </button>
            </div>
            {response && (
                <div className="mt-4 p-4 bg-black/50 rounded-lg">
                    <p className="text-lg text-cyan-300 font-mono animate-[fadeIn_1s_ease-in-out]">
                        <span className="font-bold text-yellow-300">Oracle says:</span> {response}
                    </p>
                </div>
            )}
        </div>
    );
};


// --- Leaderboard ---
const Leaderboard = ({ userId }) => {
    const [leaders, setLeaders] = useState([]);

    useEffect(() => {
        // Only attempt to fetch data if the user is authenticated (userId is available)
        if (!userId) {
            return;
        }

        const q = query(collection(db, `/artifacts/${appId}/public/data/users`), limit(10));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by balance descending
            users.sort((a, b) => (b.balance || 0) - (a.balance || 0));
            setLeaders(users);
        }, (error) => {
            // Add error handling for the snapshot listener
            console.error("Leaderboard snapshot error:", error);
        });

        return () => unsubscribe();
    }, [userId]); // Rerun this effect when userId changes (from null to a value)

    return (
        <div className="p-6 bg-gray-800/50 rounded-2xl shadow-lg border border-gray-600">
            <h2 className="text-3xl font-bold text-yellow-300 mb-4 text-center">Top Players</h2>
            <ol className="space-y-3">
                {leaders.map((leader, index) => (
                    <li key={leader.id} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                        <div className="flex items-center">
                            <span className="text-lg font-bold text-yellow-400 w-8">{index + 1}.</span>
                            <span className="text-white truncate" title={leader.id}>
                                Player-{leader.id.substring(0, 6)}
                            </span>
                        </div>
                        <span className="font-bold text-green-400">{leader.balance} FUNds</span>
                    </li>
                ))}
            </ol>
        </div>
    );
};


// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [balance, setBalance] = useState(1000);
    const [loading, setLoading] = useState(true);
    const [activeGame, setActiveGame] = useState('slots');

    const handleAuth = useCallback(async () => {
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Firebase Authentication failed:", error);
        }
    }, []);

    useEffect(() => {
        handleAuth();
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const currentUserId = currentUser.uid;
                setUserId(currentUserId);
                
                const userRef = doc(db, `/artifacts/${appId}/public/data/users`, currentUserId);
                
                // Set up a real-time listener for the user's document
                const unsubUser = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setBalance(docSnap.data().balance);
                    } else {
                        // Create user document if it doesn't exist
                        setDoc(userRef, { balance: 1000, createdAt: serverTimestamp(), id: currentUserId });
                        setBalance(1000);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("User data snapshot error:", error);
                    setLoading(false);
                });
                
                return () => unsubUser(); // Cleanup user listener
            } else {
                setUser(null);
                setUserId(null);
                setLoading(false);
            }
        });

        return () => unsubscribe(); // Cleanup auth listener
    }, [handleAuth]);

    const updateBalance = useCallback(async (amount) => {
        if (!userId) return;
        const newBalance = balance + amount;
        setBalance(newBalance); // Optimistic update
        const userRef = doc(db, `/artifacts/${appId}/public/data/users`, userId);
        try {
            await updateDoc(userRef, { balance: newBalance });
        } catch (e) {
            console.error("Error updating balance in Firestore: ", e);
            // If firestore update fails, revert the optimistic update
            setBalance(balance); 
        }
    }, [balance, userId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold animate-pulse">Connecting to Cosmo FUNd Casino...</h1>
                </div>
            </div>
        );
    }
    
    const GameNavButton = ({ gameId, label, Icon }) => (
        <button 
            onClick={() => setActiveGame(gameId)}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center p-3 sm:p-4 rounded-lg font-bold transition-all duration-300 ${activeGame === gameId ? 'bg-yellow-400 text-gray-900 shadow-lg' : 'bg-purple-700 hover:bg-purple-600 text-white'}`}
        >
            <Icon className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-0 sm:mr-3" />
            <span className="text-sm sm:text-lg">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-cover bg-center bg-fixed text-white p-4 sm:p-6" style={{backgroundImage: "url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop')"}}>
            <div className="bg-black/60 backdrop-blur-sm min-h-[calc(100vh-2rem)] sm:min-h-[calc(100vh-3rem)] p-4 sm:p-6 rounded-2xl">
                <header className="flex flex-col sm:flex-row justify-between items-center mb-6 border-b-2 border-yellow-400/50 pb-4">
                    <div className="text-center sm:text-left mb-4 sm:mb-0">
                        <h1 className="text-4xl sm:text-5xl font-bold text-yellow-300" style={{fontFamily: "'Orbitron', sans-serif"}}>Cosmo FUNd Casino</h1>
                        <p className="text-purple-300">The most decentralized fun in the galaxy!</p>
                    </div>
                    <div className="flex items-center space-x-4 bg-gray-900/70 p-3 rounded-xl shadow-lg">
                        <WalletIcon className="w-8 h-8 text-green-400" />
                        <div className="text-right">
                            <span className="text-lg font-bold text-green-300">{balance.toLocaleString()}</span>
                            <span className="text-sm text-green-500"> FUNds</span>
                        </div>
                    </div>
                </header>
                
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <nav className="flex flex-wrap justify-center gap-2 mb-6">
                            <GameNavButton gameId="slots" label="Cosmic Slots" Icon={SlotMachineIcon} />
                            <GameNavButton gameId="blackjack" label="Blackjack" Icon={BlackjackIcon} />
                            <GameNavButton gameId="roulette" label="Roulette" Icon={RouletteIcon} />
                        </nav>
                        
                        <div className="game-container">
                            {activeGame === 'slots' && <CosmicSlots balance={balance} updateBalance={updateBalance} />}
                            {activeGame === 'blackjack' && <Blackjack balance={balance} updateBalance={updateBalance} />}
                            {activeGame === 'roulette' && <Roulette balance={balance} updateBalance={updateBalance} />}
                        </div>
                    </div>
                    
                    <aside className="lg:col-span-1 space-y-6">
                        <AiOracle />
                        <Leaderboard userId={userId} />
                    </aside>
                </main>
                
                <footer className="text-center mt-8 text-gray-400 text-sm">
                    <p>Player ID: <span className="font-mono text-gray-300">{userId}</span></p>
                    <p>&copy; 2025 DevFUN Casino Challenge. All rights reserved. For entertainment purposes only.</p>
                </footer>
            </div>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                `}
            </style>
        </div>
    );
}
