import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

type OtpType = 'VERIFICATION' | 'PASSWORD_RESET';

/**
 * Envoie un e-mail avec un code OTP personnalisé.
 * @param toEmail L'adresse e-mail du destinataire.
 * @param otp Le code OTP à envoyer.
 * @param type Le motif de l'envoi (vérification ou réinitialisation).
 */
export const sendOtpEmail = async (toEmail: string, otp: string, type: OtpType = 'VERIFICATION') => {

    // Personnalisation du contenu en fonction du type
    const isReset = type === 'PASSWORD_RESET';
    const subject = isReset ? 'Réinitialisation de votre mot de passe' : 'Vérification de votre compte';
    const title = isReset ? 'Réinitialisation de mot de passe' : 'Bienvenue parmi nous !';
    const instruction = isReset
        ? 'Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le code suivant pour finaliser l\'opération :'
        : 'Merci de vous être inscrit. Pour activer votre compte, veuillez utiliser le code de validation suivant :';

    try {
        const mailOptions = {
            from: `"HospiCare" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: subject,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #0056b3; margin: 0;">${title}</h2>
                    </div>
                    <p>Bonjour,</p>
                    <p style="line-height: 1.6;">${instruction}</p>
                    <div style="background-color: #f4f7fa; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0; border: 1px dashed #0056b3;">
                        <span style="font-size: 32px; font-weight: bold; color: #0056b3; letter-spacing: 5px;">${otp}</span>
                    </div>
                    <p style="font-size: 14px; color: #666;">Ce code est valide pour les <strong>30 prochaines minutes</strong>.</p>
                    <p style="font-size: 14px; color: #666; margin-top: 20px;">Si vous n'avez pas sollicité cette action, vous pouvez ignorer cet e-mail en toute sécurité.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">
                        L'équipe Support The Specialist<br>
                        thespecialistsupport@gmail.com
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`E-mail (${type}) envoyé avec succès à ${toEmail}`);
    } catch (error) {
        console.error(`Erreur d'envoi d'e-mail à ${toEmail}:`, error);
        throw new Error('Échec de l\'envoi de l\'e-mail.');
    }
};