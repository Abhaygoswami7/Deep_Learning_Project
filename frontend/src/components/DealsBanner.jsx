import React, { useState, useEffect } from "react";

function DealsBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="deals-banner">
      <div className="deals-banner-inner">
        <div className="deals-text">
          <h2>⚡ Deal of the Day</h2>
          <p>Hurry! These deals end soon. Grab the best offers before they&apos;re gone.</p>
          <div className="deals-timer">
            <div className="timer-block">
              <div className="timer-value">{pad(timeLeft.hours)}</div>
              <div className="timer-label">Hours</div>
            </div>
            <div className="timer-block">
              <div className="timer-value">{pad(timeLeft.minutes)}</div>
              <div className="timer-label">Mins</div>
            </div>
            <div className="timer-block">
              <div className="timer-value">{pad(timeLeft.seconds)}</div>
              <div className="timer-label">Secs</div>
            </div>
          </div>
        </div>
        <button className="deals-cta">Shop Today&apos;s Deals →</button>
      </div>
    </div>
  );
}

export default DealsBanner;
