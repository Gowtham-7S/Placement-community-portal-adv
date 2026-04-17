const EmailService = require('../services/EmailService');

const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const safeUser = user.length <= 2 ? `${user[0] || ''}*` : `${user.slice(0, 2)}***`;
  return `${safeUser}@${domain}`;
};

exports.getSmtpStatus = async (req, res, next) => {
  try {
    const status = await EmailService.verifyConnection();
    return res.status(200).json({
      success: true,
      status: {
        ...status,
        user: maskEmail(process.env.SMTP_USER),
        fromName: process.env.SMTP_FROM_NAME || 'Placement Cell',
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.sendTestEmail = async (req, res, next) => {
  const { to, studentName, companyName } = req.body;

  try {
    await EmailService.sendExperienceInvitation({
      to,
      studentName: studentName || '',
      companyName: companyName || '',
    });

    return res.status(200).json({
      success: true,
      message: 'Test email request processed. Check SMTP logs for delivery.',
    });
  } catch (err) {
    next(err);
  }
};
