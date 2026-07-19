# ساخت خروجی APK

پروژه قبلاً با `eas init` به حساب Expo متصل شده (projectId توی app.json هست).
برای گرفتن فایل نصبی APK، دستورات زیر رو روی سیستم خودت اجرا کن:

## ۱. نصب EAS CLI (اگه نصب نیست)
```bash
npm install -g eas-cli
```

## ۲. لاگین به حساب Expo
```bash
eas login
```
مرورگر باز میشه و با حساب `armec` وارد میشی.

## ۳. اجرای بیلد APK (پروفایل preview = فایل apk آماده نصب)
```bash
cd armecTask-rn
eas build --platform android --profile preview
```
- وقتی پرسید "Which build profile" → `preview` رو انتخاب کن
- پلتفرم → `android`
- آپلود پروژه → `yes`

بعد از چند دقیقه لینک دانلود APK رو میده. روی گوشی باز کن و نصب کن.

## نکته
اگه خطای ۴۰۳ گرفتی (Forbidden) یعنی حسابت روی EAS Build نیاز به تایید داره:
- ایمیل تایید رو چک کن
- یا وارد https://expo.dev/accounts/armec/settings بشو و ببین وضعیت بیلد فعاله یا نه
- یا از `eas build --platform android --profile production` امتحان کن

## راه سریع‌تر (بدون بیلد): تست با Expo Go
```bash
cd armecTask-rn
npm install
npm start
```
اپلیکیشن **Expo Go** رو روی گوشی نصب کن و QR کد رو اسکن کن.
