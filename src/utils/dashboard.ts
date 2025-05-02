// Helper functions to make timestamps human readable
// Use os.env.TIMEZONE to get the timezone
// Wrapper function for date formatting
export const formatDate = (
    date: Date | number | string,
    timezone?: string,
  ): string => {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    
    if (timezone) {
      try {
        // Test if the timezone is valid
        new Intl.DateTimeFormat("en-US", { timeZone: timezone });
        options.timeZone = timezone;
      } catch (error) {
        console.warn(`Invalid timezone: ${timezone}, falling back to local timezone`);
        // Continue without setting timezone, will use local browser timezone
      }
    }
    
    return d.toLocaleString("en-US", options);
  };
