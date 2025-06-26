import React, { useState, useEffect } from "react";

function OTPModal({ isOpen, onClose, onVerify }) {
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(180);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(180);
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? (clearInterval(interval), 0) : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-sm text-center">
        <h2 className="text-xl font-semibold mb-4">Enter OTP</h2>
        <p className="text-sm text-gray-600 mb-4">
          Expires in{" "}
          <span className="font-medium">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </p>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          className="w-full px-3 py-2 border rounded-md text-center text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="------"
        />
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => onVerify(otp)}
            disabled={secondsLeft === 0}
            className={`
              px-4 py-2 rounded-md font-medium
              ${
                secondsLeft === 0
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }
            `}
          >
            Verify
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default OTPModal;
