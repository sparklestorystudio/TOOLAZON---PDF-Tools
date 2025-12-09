import React from 'react';
import { Star } from 'lucide-react';

const Reviews: React.FC = () => {
  return (
    <section className="py-12 text-center bg-white">
      <div className="flex justify-center items-center gap-1 mb-2">
        <span className="text-3xl font-bold text-gray-800">4.5</span>
        <div className="flex ml-2">
          {[1, 2, 3, 4].map((i) => (
            <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          ))}
          <div className="relative">
             <Star className="w-5 h-5 text-gray-300 fill-gray-300" />
             <div className="absolute top-0 left-0 overflow-hidden w-[50%]">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
             </div>
          </div>
        </div>
      </div>
      <p className="text-gray-500 text-sm">1,874 Google reviews</p>
    </section>
  );
};

export default Reviews;
