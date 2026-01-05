module.exports = {
    admin: null,
    sendNotification: async (tokens, notification) => {
        console.log('[INFO] Firebase disabled. Notification not sent:', {
            tokens: tokens.length,
            notification
        });
        // Return success untuk compatibility
        return { success: true, disabled: true };
    }
};