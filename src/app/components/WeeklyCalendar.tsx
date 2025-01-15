import { useState, useEffect, useRef } from 'react';
import { startOfYear, endOfYear, eachWeekOfInterval, isBefore, format, addDays, max, min, startOfDay, isWithinInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Zen_Maru_Gothic } from 'next/font/google';

const zenMaru = Zen_Maru_Gothic({ 
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

interface WeeklyCalendarProps {
  year?: number;
}

function YearSelector({ value, onChange, currentYear }: { 
  value: number;
  onChange: (year: number) => void;
  currentYear: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={selectorRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-2xl bg-transparent focus:outline-none cursor-pointer flex items-center gap-1"
      >
        {value}
        <svg
          className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-3 min-w-[120px] z-10">
          {Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map(year => (
            <button
              key={year}
              onClick={() => {
                onChange(year);
                setIsOpen(false);
              }}
              className={`w-full px-6 py-2 text-left hover:bg-gray-100 ${
                year === value ? 'bg-gray-100' : ''
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WeeklyCalendar({ year: initialYear }: WeeklyCalendarProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(initialYear || currentYear);
  const [weeks, setWeeks] = useState<Date[]>([]);
  const today = startOfDay(new Date());

  useEffect(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
    
    const weeksInYear = eachWeekOfInterval(
      { start: yearStart, end: yearEnd },
      { locale: zhCN }
    );
    
    setWeeks(weeksInYear);
  }, [selectedYear]);

  // 计算需要的行数
  const rowCount = Math.ceil(weeks.length / 7);
  
  return (
    <div className={`h-screen flex flex-col p-4 ${zenMaru.className}`}>
      <div className="mx-auto w-full max-w-[700px] flex flex-col h-full">
        <div className="flex-none mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-wide flex items-baseline gap-2">
                <span>Yeeks</span>
                <YearSelector
                  value={selectedYear}
                  onChange={setSelectedYear}
                  currentYear={currentYear}
                />
              </h1>
              <p className="text-sm text-gray-400 pl-1">Your year in weeks</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-start">
          <table className="border-collapse w-full">
            <tbody>
              {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {weeks.slice(rowIndex * 7, (rowIndex + 1) * 7).map((weekStart, colIndex) => {
                    const index = rowIndex * 7 + colIndex;
                    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
                    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
                    
                    // 确保开始日期不早于年初
                    const displayStart = max([weekStart, yearStart]);
                    // 确保结束日期不晚于年末
                    const displayEnd = min([addDays(weekStart, 6), yearEnd]);

                    // 计算周数
                    const weekNumber = index + 1;

                    // 计算是否为当前周
                    const isCurrentWeek = isWithinInterval(today, {
                      start: displayStart,
                      end: displayEnd
                    });
                    
                    return (
                      <td 
                        key={index}
                        className={`
                          group relative
                          border border-gray-300
                          w-[calc(min(100%/7,calc((100vh-8rem)/${rowCount})))]
                          before:content-['']
                          before:block
                          before:pb-[100%]
                          ${isCurrentWeek 
                            ? 'bg-gray-200'
                            : isBefore(displayEnd, today)
                              ? 'bg-gray-600'
                              : 'bg-white'
                          }
                          transition-colors duration-200
                          cursor-pointer
                          p-0
                        `}
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className={`
                            opacity-0 group-hover:opacity-100 
                            transition-opacity duration-200 
                            text-center
                            ${isBefore(displayEnd, today) 
                              ? 'text-white' 
                              : isCurrentWeek
                                ? 'text-gray-600'
                                : 'text-gray-500'
                            }
                          `}>
                            <div className="text-2xl font-bold mb-1">
                              {weekNumber}
                            </div>
                            <div className="text-xs">
                              {format(displayStart, 'M.d', { locale: zhCN })} - {format(displayEnd, 'M.d', { locale: zhCN })}
                            </div>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 