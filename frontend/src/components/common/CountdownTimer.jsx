import { useEffect, useState } from 'react';

export const CountdownTimer = ({ targetDate, targetTime }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Parse targetTime to get hours (e.g., "23:00 - 05:00" -> 23)
      let eventHour = 23; // Default to 23:00
      if (targetTime) {
        const timeParts = targetTime.split(':');
        if (timeParts.length > 0) {
          eventHour = parseInt(timeParts[0], 10) || 23;
        }
      }
      
      // Create full datetime
      const eventDateTime = new Date(targetDate);
      eventDateTime.setHours(eventHour, 0, 0, 0);
      
      const difference = eventDateTime - new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate, targetTime]);

  return (
    <div className="countdown-container" data-testid="countdown-timer">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="countdown-box">
          <div className="countdown-number">{String(value).padStart(2, '0')}</div>
          <div className="countdown-label">{unit}</div>
        </div>
      ))}
    </div>
  );
};
