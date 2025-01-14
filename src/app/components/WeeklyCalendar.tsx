import { useState, useEffect } from 'react';
import { startOfYear, endOfYear, eachWeekOfInterval, isBefore, format, addDays, max, min, startOfDay, isWithinInterval, differenceInDays } from 'date-fns';
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
  const rowCount = Math.ceil(weeks.length / 4);
  
  return (
    <div className={`h-screen flex flex-col p-4 ${zenMaru.className}`}>
      <div className="flex-none mb-4 max-w-[800px] mx-auto w-full relative">
        <div>
          <h1 className="text-3xl font-bold tracking-wide">Yeeks</h1>
          <p className="text-sm text-gray-400 pl-1">以周度年</p>
        </div>
        <h2 className="text-2xl font-bold absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">{year}</h2>
      </div>
      <div className="flex-1 min-h-[400px] overflow-auto">
        <div 
          className="grid grid-cols-4 gap-2 mx-auto h-full"
          style={{
            gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
            maxWidth: '800px'
          }}
        >
          {weeks.map((weekStart, index) => {
            const isFirstRow = index < 4;
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
            
            // 计算渐变效果
            let gradientStyle = {};
            if (isCurrentWeek) {
              const totalDays = differenceInDays(displayEnd, displayStart) + 1;
              const passedDays = differenceInDays(today, displayStart);
              
              if (passedDays >= totalDays) {
                // 如果是最后一天，显示完全蓝色
                gradientStyle = {
                  backgroundColor: '#bfdbfe'
                };
              } else {
                gradientStyle = {
                  backgroundImage: `linear-gradient(to right, 
                    #bfdbfe 0%,
                    #bfdbfe 10%,
                    rgb(246 246 246) 50%,
                    #f3f4f6 90%,
                    #f3f4f6 100%
                  )`
                };
              }
            }
            
            return (
              <div 
                key={index}
                style={isCurrentWeek ? gradientStyle : {}}
                className={`
                  group relative rounded-lg min-h-[40px]
                  ${!isCurrentWeek && (isBefore(displayEnd, today)
                    ? 'bg-blue-200 hover:bg-blue-300'
                    : 'bg-gray-100 hover:bg-gray-200'
                  )}
                  transition-colors duration-200
                  cursor-pointer
                `}
              >
                <div className={`
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  absolute ${isFirstRow ? 'top-[calc(100%+8px)]' : '-top-12'} left-1/2 -translate-x-1/2
                  bg-gray-800 text-white px-3 py-2 rounded-lg
                  text-sm whitespace-nowrap z-10
                  pointer-events-none
                `}>
                  第{weekNumber}周
                  <br />
                  {format(displayStart, 'MM.dd', { locale: zhCN })} - {format(displayEnd, 'MM.dd', { locale: zhCN })}
                  <div className={`
                    absolute ${isFirstRow ? 'top-[-6px]' : 'bottom-[-6px]'} 
                    left-1/2 -translate-x-1/2 
                    w-2 h-2 bg-gray-800 rotate-45
                  `}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 