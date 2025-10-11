import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Check } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  initial: string;
  rating: number;
  review: string;
  date: string;
  isVerified?: boolean;
}

export function TestimonialCard({
  name,
  initial,
  rating,
  review,
  date,
  isVerified = false,
}: TestimonialCardProps) {
  return (
    <div className="relative flex-shrink-0 w-[320px] md:w-[360px] lg:w-[400px] p-6 bg-[#1a1a1a] rounded-xl shadow-lg border border-[#2a2a2a] mx-4">
      {isVerified && (
        <div className="absolute top-4 right-4 text-green-500 flex items-center justify-center">
          <Star className="w-5 h-5 fill-current text-green-500" />
          <Check className="absolute w-3 h-3 text-white" />
        </div>
      )}
      <div className="flex items-center mb-4">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarFallback className="bg-purple-600 text-white text-lg font-semibold">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          <div className="flex items-center mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < rating ? "text-yellow-400 fill-current" : "text-gray-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-gray-300 text-sm mb-4 line-clamp-5">{review}</p>
      <p className="text-gray-500 text-xs">{date}</p>
    </div>
  );
}