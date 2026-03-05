-- Function to create notifications for new jobs
CREATE OR REPLACE FUNCTION notify_new_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all students about new job postings
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT 
    p.id,
    'New Job Opportunity Available',
    'A new ' || NEW.job_type || ' position for ' || NEW.title || ' at ' || NEW.company || ' has been posted.',
    'job_posted'
  FROM public.profiles p
  WHERE p.role = 'student' AND p.is_approved = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications for new meetings
CREATE OR REPLACE FUNCTION notify_new_meeting()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all approved users about new meetings
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT 
    p.id,
    'New Meeting Scheduled',
    'A new meeting "' || NEW.title || '" has been scheduled for ' || TO_CHAR(NEW.meeting_date, 'Mon DD, YYYY at HH12:MI AM') || '.',
    'meeting_scheduled'
  FROM public.profiles p
  WHERE p.is_approved = true AND p.id != NEW.host_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create meeting reminder notifications
CREATE OR REPLACE FUNCTION notify_meeting_reminder()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify registered users about upcoming meetings (24 hours before)
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT 
    mr.user_id,
    'Meeting Reminder',
    'Reminder: "' || NEW.title || '" meeting is scheduled for tomorrow at ' || TO_CHAR(NEW.meeting_date, 'HH12:MI AM') || '.',
    'meeting_reminder'
  FROM public.meeting_registrations mr
  WHERE mr.meeting_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_new_job ON public.jobs;
CREATE TRIGGER trigger_notify_new_job
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  WHEN (NEW.is_approved = true AND NEW.is_active = true)
  EXECUTE FUNCTION notify_new_job();

DROP TRIGGER IF EXISTS trigger_notify_new_meeting ON public.meetings;
CREATE TRIGGER trigger_notify_new_meeting
  AFTER INSERT ON public.meetings
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION notify_new_meeting();

-- Create a function to send meeting reminders (to be called by a scheduled job)
CREATE OR REPLACE FUNCTION send_meeting_reminders()
RETURNS void AS $$
BEGIN
  -- Insert reminder notifications for meetings happening in the next 24 hours
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT DISTINCT
    mr.user_id,
    'Meeting Reminder',
    'Reminder: "' || m.title || '" meeting is scheduled for ' || TO_CHAR(m.meeting_date, 'Mon DD at HH12:MI AM') || '.',
    'meeting_reminder'
  FROM public.meetings m
  JOIN public.meeting_registrations mr ON m.id = mr.meeting_id
  WHERE m.meeting_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
    AND m.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.user_id = mr.user_id 
        AND n.type = 'meeting_reminder' 
        AND n.message LIKE '%' || m.title || '%'
        AND n.created_at > NOW() - INTERVAL '25 hours'
    );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_new_job() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_new_meeting() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_meeting_reminder() TO authenticated;
GRANT EXECUTE ON FUNCTION send_meeting_reminders() TO authenticated;
