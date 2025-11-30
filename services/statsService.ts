import { LessonWithMonth, SubjectProgress, TeacherStats } from '../types';

/**
 * حساب إحصائيات المعلم
 * @param allLessons - جميع الدروس مع الأشهر المفترضة
 * @param teacherReports - تقارير المعلم المحفوظة
 * @param currentMonth - الشهر الحالي (1-12)
 * @returns إحصائيات المعلم
 */
export function calculateTeacherStats(
  allLessons: LessonWithMonth[],
  teacherReports: any[][],
  currentMonth: number
): TeacherStats {
  // استخراج المواد/المستويات التي يدرسها المعلم من تقاريره
  const teacherSubjects = new Set<string>();
  const completedLessons = new Set<string>();
  
  teacherReports.forEach(report => {
    // Report structure: [timestamp, id, name, school, level, section, date, quranReport, subject1, gender1, lesson1, ...]
    const [, , , , level, , , , subject1, gender1, lesson1, , , , , subject2, gender2, lesson2] = report;
    
    if (subject1 && lesson1) {
      const key = `${level}-${subject1}`;
      teacherSubjects.add(key);
      completedLessons.add(`${level}-${subject1}-${gender1 || ''}-${lesson1}`);
    }
    
    if (subject2 && lesson2) {
      const key = `${level}-${subject2}`;
      teacherSubjects.add(key);
      completedLessons.add(`${level}-${subject2}-${gender2 || ''}-${lesson2}`);
    }
  });
  
  // حساب الإحصائيات لكل مادة
  const subjectProgress: SubjectProgress[] = [];
  let totalExpected = 0;
  let totalCompleted = 0;
  let totalOverdue = 0;
  
  teacherSubjects.forEach(subjectKey => {
    const [level, subject] = subjectKey.split('-');
    
    // عدد الدروس المتوقعة لهذه المادة
    const expectedLessons = allLessons.filter(l => 
      l.level === level && l.subject === subject
    );
    
    // عدد الدروس المنجزة
    const completed = expectedLessons.filter(l => {
      const lessonKey = `${l.level}-${l.subject}-${l.gender || ''}-${l.lesson}`;
      return completedLessons.has(lessonKey);
    }).length;
    
    // عدد الدروس المتأخرة (شهرها المفترض < الشهر الحالي ولم تُنجز)
    const overdue = expectedLessons.filter(l => {
      const lessonKey = `${l.level}-${l.subject}-${l.gender || ''}-${l.lesson}`;
      return l.expectedMonth > 0 && l.expectedMonth < currentMonth && !completedLessons.has(lessonKey);
    }).length;
    
    const total = expectedLessons.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    subjectProgress.push({
      subject,
      level,
      completed,
      total,
      percentage,
      overdue
    });
    
    totalExpected += total;
    totalCompleted += completed;
    totalOverdue += overdue;
  });
  
  const overallPercentage = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;
  
  return {
    totalCompleted,
    totalExpected,
    overallPercentage,
    subjectProgress: subjectProgress.sort((a, b) => b.percentage - a.percentage),
    totalOverdue
  };
}

/**
 * الحصول على الشهر الحالي (1-12)
 */
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1; // getMonth() returns 0-11, we need 1-12
}
