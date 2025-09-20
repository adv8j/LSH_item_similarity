import React from 'react';

export default function Loader(){
  return (
    <div className="w-full py-20 flex justify-center items-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );
}
