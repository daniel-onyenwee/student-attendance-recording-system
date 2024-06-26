export default `DO $$ DECLARE crash_course_attendance_record record;
attendance_register_student record;
BEGIN FOR crash_course_attendance_record IN 
SELECT 
  * 
FROM 
  (
    SELECT 
      C_A.ATTENDANCE_REGISTER_ID AS ATTENDANCE_REGISTER_ID, 
      C_C_A.ID AS CRASH_COURSE_ATTENDANCE_ID, 
      C_A.ID AS CLASS_ATTENDANCE_ID, 
      C_C_A.STUDENT_ID 
    FROM 
      PUBLIC.CRASH_COURSE_ATTENDANCES AS C_C_A 
      JOIN (
        SELECT 
          C_A_1.ID AS ID, 
          C_A_1.START_TIME, 
          C_A_1.END_TIME, 
          C_A_1.DATE, 
          A_R.SESSION AS SESSION, 
          A_R.ID AS ATTENDANCE_REGISTER_ID, 
          A_R.COURSE_ID AS COURSE_ID 
        FROM 
          PUBLIC.CLASS_ATTENDANCES AS C_A_1 
          JOIN PUBLIC.ATTENDANCE_REGISTERS AS A_R ON C_A_1.ATTENDANCE_REGISTER_ID = A_R.ID 
        WHERE 
          STATUS = 'COMPLETED' :: "ClassAttendanceStatus"
      ) AS C_A ON C_A.SESSION = C_C_A.SESSION 
      AND C_A.COURSE_ID = C_C_A.COURSE_ID 
      AND C_A.DATE = C_C_A.DATE 
      AND C_A.START_TIME = C_C_A.START_TIME 
      AND C_A.END_TIME = C_C_A.END_TIME
  ) AS _query LOOP INSERT INTO public.attendance_register_students(
    id, attendance_register_id, student_id, 
    updated_at
  ) 
VALUES 
  (
    gen_random_uuid():: TEXT, 
    crash_course_attendance_record.ATTENDANCE_REGISTER_ID, 
    crash_course_attendance_record.STUDENT_ID, 
    now()
  ) ON CONFLICT(
    attendance_register_id, student_id
  ) DO 
UPDATE 
SET 
  student_id = crash_course_attendance_record.STUDENT_ID RETURNING id INTO attendance_register_student;
INSERT INTO public.class_attendees(
  id, class_attendance_id, attendance_register_student_id, 
  updated_at
) 
VALUES 
  (
    gen_random_uuid():: TEXT, 
    crash_course_attendance_record.CLASS_ATTENDANCE_ID, 
    attendance_register_student.id, 
    now()
  ) ON CONFLICT(
    class_attendance_id, attendance_register_student_id
  ) DO NOTHING;
DELETE FROM 
  public.CRASH_COURSE_ATTENDANCES 
WHERE 
  id = crash_course_attendance_record.CRASH_COURSE_ATTENDANCE_ID;
END LOOP;
END $$
`