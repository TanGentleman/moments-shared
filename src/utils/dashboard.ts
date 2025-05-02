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
      options.timeZone = timezone;
    }
    return d.toLocaleString("en-US", options);
  };
