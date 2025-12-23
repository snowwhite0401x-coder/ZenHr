# คู่มือ Deploy แบบ Manual Upload (อัพโหลดโฟลเดอร์)

## ⚠️ สำคัญ: ต้อง Build โปรเจคก่อน!

เมื่อ deploy แบบ manual upload คุณต้องอัพโหลด folder `dist` ที่ build แล้ว **ไม่ใช่** source code

---

## ขั้นตอนที่ 1: Build โปรเจค

รันคำสั่งนี้ใน terminal:

```bash
npm install
npm run build
```

คำสั่งนี้จะสร้าง folder `dist` ที่มีไฟล์ที่พร้อม deploy แล้ว

---

## ขั้นตอนที่ 2: ตรวจสอบไฟล์ใน folder `dist`

หลัง build เสร็จ ให้ตรวจสอบว่าใน folder `dist` มีไฟล์เหล่านี้:

✅ **ไฟล์ที่ต้องมี:**
- `index.html`
- `assets/` (folder ที่มีไฟล์ JS และ CSS)
- `_headers` ⚠️ สำคัญ!
- `_redirects` ⚠️ สำคัญ!

**ตรวจสอบว่า `_headers` และ `_redirects` อยู่ใน `dist` หรือไม่**

หากไม่มี ให้รัน build อีกครั้ง หรือคัดลอกด้วยตนเอง:
- คัดลอก `_headers` จาก root → `dist/_headers`
- คัดลอก `_redirects` จาก root → `dist/_redirects`

---

## ขั้นตอนที่ 3: ตรวจสอบไฟล์ `_headers` และ `_redirects` ใน `dist`

หลัง build เสร็จ **ต้องตรวจสอบ** ว่าไฟล์ `_headers` และ `_redirects` อยู่ใน folder `dist` หรือไม่

### วิธีตรวจสอบ (Windows PowerShell):
```powershell
cd c:\Users\USER\Documents\zenhr-leave-manager
Test-Path dist\_headers
Test-Path dist\_redirects
```

### หากไม่มีไฟล์เหล่านี้:

**วิธีที่ 1: ใช้ script (แนะนำ)**
```bash
npm run build:cf
```

**วิธีที่ 2: คัดลอกด้วยตนเอง**
```powershell
# ใน PowerShell
Copy-Item _headers dist\_headers
Copy-Item _redirects dist\_redirects
```

---

## ขั้นตอนที่ 4: อัพโหลด folder `dist` ไปยัง Cloudflare Pages

⚠️ **สำคัญ**: ต้องอัพโหลด **contents ของ folder `dist`** ไม่ใช่ folder `dist` เอง

### วิธีที่ถูกต้อง:

1. เปิด folder `dist` ใน File Explorer
2. **เลือกไฟล์ทั้งหมด** (Ctrl+A) ใน folder `dist`:
   - `index.html`
   - `_headers` ⚠️ สำคัญ!
   - `_redirects` ⚠️ สำคัญ!
   - `index.css`
   - `assets/` (folder)
3. ลากไฟล์ทั้งหมดที่เลือกไปวางในพื้นที่อัพโหลดของ Cloudflare Pages
4. เลือก **Production** environment
5. คลิก **Save and deploy**

**หรือ**

1. ไปที่ Cloudflare Pages Dashboard
2. เลือก project ของคุณ
3. ไปที่แท็บ **Deployments**
4. คลิก **Create deployment** หรือ **Upload assets**
5. **ลากไฟล์ทั้งหมด** จาก folder `dist` ไปวางในพื้นที่อัพโหลด
6. เลือก **Production** environment
7. คลิก **Save and deploy**

---

## ⚠️ ปัญหาที่พบบ่อย

### ปัญหา: ยังเห็นหน้าขาว และมี MIME type error

**สาเหตุ:**
1. อัพโหลด source code แทนที่จะเป็น folder `dist` ที่ build แล้ว
2. ไฟล์ `_headers` ไม่ได้อยู่ใน folder `dist` ที่อัพโหลด
3. อัพโหลด folder `dist` ทั้ง folder แทนที่จะเป็น contents ของมัน

**วิธีแก้:**
1. รัน `npm run build:cf` (จะ build และคัดลอกไฟล์ Cloudflare อัตโนมัติ)
2. หรือรัน `npm run build` แล้วคัดลอก `_headers` และ `_redirects` ด้วยตนเอง
3. เปิด folder `dist` แล้วเลือกไฟล์ทั้งหมดข้างใน (ไม่ใช่ folder `dist` เอง)
4. ลากไฟล์ทั้งหมดไปอัพโหลดใหม่

### ปัญหา: Build ไม่ได้ (vite not found)

**วิธีแก้:**
1. ลบ `node_modules` และ `package-lock.json`
2. รัน `npm install` ใหม่
3. รัน `npm run build` อีกครั้ง

---

### ปัญหา: ไฟล์ `_headers` ไม่ถูกคัดลอกไป `dist`

**วิธีแก้:**
1. ตรวจสอบว่า `vite.config.ts` มี plugin คัดลอกไฟล์
2. หรือคัดลอกด้วยตนเอง:
   ```bash
   copy _headers dist\_headers
   copy _redirects dist\_redirects
   ```

---

## วิธีตรวจสอบ Build Output

หลังรัน `npm run build` ควรเห็น:

```
dist/
├── index.html
├── _headers
├── _redirects
├── index.css
└── assets/
    ├── index-[hash].js
    └── index-[hash].css
```

หากไม่มี `_headers` หรือ `_redirects` ให้คัดลอกด้วยตนเองก่อนอัพโหลด

