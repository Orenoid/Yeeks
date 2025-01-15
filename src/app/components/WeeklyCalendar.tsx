import { useState, useEffect } from 'react';
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

export default function WeeklyCalendar({ year = new Date().getFullYear() }: WeeklyCalendarProps) {
  const [weeks, setWeeks] = useState<Date[]>([]);
  const today = startOfDay(new Date());

  useEffect(() => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    
    const weeksInYear = eachWeekOfInterval(
      { start: yearStart, end: yearEnd },
      { locale: zhCN }
    );
    
    setWeeks(weeksInYear);
  }, [year]);

  // 计算需要的行数
  const rowCount = Math.ceil(weeks.length / 7);
  
  return (
    <div className={`h-screen flex flex-col p-4 ${zenMaru.className}`}>
      <div className="mx-auto w-full max-w-[700px] flex flex-col h-full">
        <div className="flex-none mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-wide">
              <span>Yeeks</span>
              <span className="text-2xl ml-2">{year}</span>
            </h1>
            <p className="text-sm text-gray-400 pl-1">Your year in weeks</p>
          </div>
        </div>
        <div className="flex-1 flex items-start">
          <table className="border-collapse w-full">
            <tbody>
              {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {weeks.slice(rowIndex * 7, (rowIndex + 1) * 7).map((weekStart, colIndex) => {
                    const index = rowIndex * 7 + colIndex;
                    const yearStart = startOfYear(new Date(year, 0, 1));
                    const yearEnd = endOfYear(new Date(year, 0, 1));
                    
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