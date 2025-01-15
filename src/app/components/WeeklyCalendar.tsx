import { useState, useEffect, useRef } from 'react';
import { startOfYear, endOfYear, eachWeekOfInterval, isBefore, format, addDays, max, min, startOfDay, isWithinInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Zen_Maru_Gothic } from 'next/font/google';

const zenMaru = Zen_Maru_Gothic({ 
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

interface WeekNote {
  content: string;
  lastModified: Date;
}

interface WeekData {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  note?: WeekNote;
}

interface WeeklyCalendarProps {
  year?: number;
}

interface WeekModalProps {
  weekData: WeekData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
}

function WeekModal({ weekData, isOpen, onClose, onSave }: WeekModalProps) {
  const [content, setContent] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (weekData?.note) {
      setContent(weekData.note.content);
    } else {
      setContent('');
    }
  }, [weekData]);

  // 自动获取焦点
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // 自动保存功能
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (weekData && content !== weekData.note?.content) {
        onSave(content);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [content, weekData, onSave]);

  if (!isOpen || !weekData) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/5 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      
      {/* 侧边面板 */}
      <div 
        ref={panelRef}
        className={`
          w-[calc(min(100%-2rem,600px))] bg-white h-full shadow-lg
          fixed right-0 top-0
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6">
          <div>
            <div className="text-2xl font-bold mb-1">
              Week {weekData.weekNumber}
            </div>
            <div className="text-gray-500">
              {format(weekData.startDate, 'M.d', { locale: zhCN })} - {format(weekData.endDate, 'M.d', { locale: zhCN })}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区 */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write down what you want to do or what you did this week"
          className="flex-1 w-full p-6 focus:outline-none resize-none"
        />
      </div>
    </div>
  );
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
  const [weekNotes, setWeekNotes] = useState<Record<string, WeekNote>>({});
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const today = startOfDay(new Date());

  useEffect(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
    
    const weeksInYear = eachWeekOfInterval(
      { start: yearStart, end: yearEnd },
      { locale: zhCN }
    );
    
    setWeeks(weeksInYear);

    // 从 localStorage 加载笔记
    const storedNotes = localStorage.getItem(`weekNotes_${selectedYear}`);
    if (storedNotes) {
      setWeekNotes(JSON.parse(storedNotes));
    } else {
      setWeekNotes({});
    }
  }, [selectedYear]);

  const handleWeekClick = (weekStart: Date, weekNumber: number, displayStart: Date, displayEnd: Date) => {
    const weekData: WeekData = {
      weekNumber,
      startDate: displayStart,
      endDate: displayEnd,
      note: weekNotes[`${weekNumber}`]
    };
    setSelectedWeek(weekData);
    setIsModalOpen(true);
  };

  const handleSaveNote = (content: string) => {
    if (!selectedWeek) return;

    const newNote: WeekNote = {
      content,
      lastModified: new Date()
    };

    const newWeekNotes = {
      ...weekNotes,
      [`${selectedWeek.weekNumber}`]: newNote
    };

    setWeekNotes(newWeekNotes);
    localStorage.setItem(`weekNotes_${selectedYear}`, JSON.stringify(newWeekNotes));
  };

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
                    
                    const displayStart = max([weekStart, yearStart]);
                    const displayEnd = min([addDays(weekStart, 6), yearEnd]);
                    const weekNumber = index + 1;
                    const isCurrentWeek = isWithinInterval(today, {
                      start: displayStart,
                      end: displayEnd
                    });
                    const hasNote = weekNotes[`${weekNumber}`]?.content;
                    const isSelected = selectedWeek?.weekNumber === weekNumber && isModalOpen;
                    
                    return (
                      <td 
                        key={index}
                        onClick={() => handleWeekClick(weekStart, weekNumber, displayStart, displayEnd)}
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
                          ${hasNote ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                        `}
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className={`
                            text-center
                            w-full px-0.5
                            ${isBefore(displayEnd, today) 
                              ? 'text-white' 
                              : isCurrentWeek
                                ? 'text-gray-600'
                                : 'text-gray-300 group-hover:text-gray-600'
                            }
                          `}>
                            <div className="text-[min(5vw,1.25rem)] font-bold mb-0.5">
                              {weekNumber}
                            </div>
                            <div className={`
                              text-[min(2vw,0.7rem)] leading-none whitespace-nowrap
                              ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                              transition-opacity duration-200
                            `}>
                              {format(displayStart, 'M.d', { locale: zhCN })}-{format(displayEnd, 'M.d', { locale: zhCN })}
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
      <WeekModal
        weekData={selectedWeek}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNote}
      />
    </div>
  );
} 