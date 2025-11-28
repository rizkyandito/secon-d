import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
      <div className="text-center">
        <p className="text-lg font-semibold">Memuat data...</p>
        <p className="text-sm">Sabar ya.. server Gratis soalnya</p>
      </div>
    </div>
  );
}
