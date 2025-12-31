import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactConfetti from "react-confetti";
import "../Styles/home.css";
import timezones from './timezone.json';

const Home = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [use24HourFormat, setUse24HourFormat] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const itemsRef = useRef([]);
  const lastScrollTime = useRef(0);
  const scrollCooldown = 500; // ms

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleScroll = useCallback(
    (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastScrollTime.current < scrollCooldown) return;
      lastScrollTime.current = now;

      const direction = e.deltaY > 0 ? 1 : -1;
      const nextIndex = Math.min(
        Math.max(currentItemIndex + direction, 0),
        timezones.length - 1
      );
      if (nextIndex !== currentItemIndex) {
        itemsRef.current[nextIndex]?.scrollIntoView({ behavior: "smooth" });
        setCurrentItemIndex(nextIndex);
      }
    },
    [currentItemIndex]
  );

  useEffect(() => {
    const wrapper = document.querySelector(".wrapper");
    if (wrapper) {
      const handleWheel = (e) => {
        e.preventDefault();
        handleScroll(e);
      };
      wrapper.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        wrapper.removeEventListener("wheel", handleWheel);
      };
    }
  }, [handleScroll]);

  const calculateTimeUntilNewYear = (timezone) => {
    const offset =
      timezone === "GMT" ? 0 : parseInt(timezone.replace("GMT", ""), 10);
    const now = new Date(currentDate.getTime() + offset * 3600000 - 3600000);
    const newYear = new Date(now.getFullYear() + 1, 0, 1);
    const diff = newYear - now;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, diff };
  };

  const formatTime = (timezone) => {
    const offset =
      timezone === "GMT" ? 0 : parseInt(timezone.replace("GMT", ""), 10);
    const time = new Date(currentDate.getTime() + offset * 3600000 - 3600000);
    return time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: !use24HourFormat,
    });
  };

  const findNextNewYearTimezone = () => {
    let shortestTime = Infinity;
    let nextIndex = 0;
    timezones.forEach((timezone, index) => {
      const { diff } = calculateTimeUntilNewYear(timezone.zone);
      if (diff < shortestTime && diff > 0) {
        shortestTime = diff;
        nextIndex = index;
      }
    });
    return nextIndex;
  };

  const handleNextNewYearClick = () => {
    const nextIndex = findNextNewYearTimezone();
    itemsRef.current[nextIndex]?.scrollIntoView({ behavior: "smooth" });
    setCurrentItemIndex(nextIndex);
  };

  const scrollToTop = () => {
    itemsRef.current[0]?.scrollIntoView({ behavior: "smooth" });
    setCurrentItemIndex(0);
  };

  const checkNewYear = (timezone) => {
    const { hours, minutes, seconds } = calculateTimeUntilNewYear(timezone);
    if (hours === 0 && minutes === 0 && seconds === 0) {
      console.log(`New Year reached for timezone: ${timezone}`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 10000);
    }
  };

  useEffect(() => {
    timezones.forEach((timezone) => checkNewYear(timezone.zone));
  }, [currentDate, checkNewYear]);

  const startConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 10000);
  };

  useEffect(() => {
    window.startConfetti = startConfetti;
    return () => {
      delete window.startConfetti;
    };
  }, []);

  // say in console: startConfetti();
  return (
    <div className="wrapper">
      <div className="header">
        <h1>New Years Countdown {currentDate.toLocaleString()}</h1>
        <div className="button-container">
          <button onClick={() => setUse24HourFormat(!use24HourFormat)}>
            {use24HourFormat
              ? "Switch to 12-hour format"
              : "Switch to 24-hour format"}
          </button>{" "}
          {"| "}
          <button onClick={handleNextNewYearClick}>Next New Year</button> {"| "}
          <button onClick={scrollToTop}>Back to Top</button>
        </div>
      </div>
      <div className="content">
        {timezones.map((timezone, index) => {
          const { days, hours, minutes, seconds } = calculateTimeUntilNewYear(
            timezone.zone
          );
          return (
            <div
              key={index}
              ref={(el) => (itemsRef.current[index] = el)}
              className={`country-time-item ${
                index === currentItemIndex ? "active" : ""
              }`}
            >
              <h2>{timezone.countries.join(", ")}</h2>
              <p>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Learn about Timezones"
                  title="Wikipedia Timezones Overview [NEW TAB]"
                  href="https://en.wikipedia.org/wiki/Time_zone"
                >
                  <strong>Timezone:</strong>
                </a>{" "}
                {""}
                {timezone.zone}
              </p>
              <p>
                <strong>Current Time:</strong> {formatTime(timezone.zone)}
              </p>
              <p>
                <strong>Time until New Year:</strong>{" "}
                {`${days}d ${hours}h ${minutes}m ${seconds}s`}
              </p>
            </div>
          );
        })}
      </div>
      {showConfetti && (
        <>
          {console.log("Confetti is showing")}
          <ReactConfetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={500}
            gravity={0.1}
            initialVelocityY={-10}
            wind={0.05}
          />
        </>
      )}
    </div>
  );
};

export default Home;
