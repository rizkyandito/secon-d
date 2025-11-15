import React from 'react';

export default function ImageModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Menu" className="max-w-full max-h-[90vh] object-contain" />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 btn btn-circle btn-sm"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
