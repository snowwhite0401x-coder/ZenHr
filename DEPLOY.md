# คู่มือ Deploy อัตโนมัติบน Cloudflare Pages

## วิธีการ Setup Continuous Deployment

### ขั้นตอนที่ 1: สร้าง Git Repository

1. สร้าง repository บน GitHub, GitLab หรือ Bitbucket
2. Push โค้ดไปยัง repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <URL_REPOSITORY_ของคุณ>
git push -u origin main
```

### ขั้นตอนที่ 2: เชื่อมต่อกับ Cloudflare Pages

1. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. เลือก **Pages** จากเมนูด้านซ้าย
3. คลิก **Create a project**
4. เลือก **Connect to Git**
5. เลือก Git provider ที่คุณใช้ (GitHub, GitLab, หรือ Bitbucket)
6. อนุญาตให้ Cloudflare เข้าถึง repository ของคุณ
7. เลือก repository `zenhr-leave-manager`

### ขั้นตอนที่ 3: ตั้งค่า Build Configuration

ในหน้า Setup Builds ให้ตั้งค่าดังนี้:

- **Project name**: `zenhr-leave-manager` (หรือชื่อที่คุณต้องการ)
- **Production branch**: `main` (หรือ `master`)
- **Build command**: `npm run build`
- **Build output directory**: `dist`

### ขั้นตอนที่ 4: ตั้งค่า Environment Variables (ถ้ามี)

หากคุณใช้ Environment Variables (เช่น GEMINI_API_KEY):

1. ไปที่ Settings ของ project
2. เลือก **Environment variables** (ในส่วน Variables and Secrets)
3. คลิก **+ Add** เพื่อเพิ่ม variable:
   - **Type**: Secret (เพื่อความปลอดภัย)
   - **Name**: `GEMINI_API_KEY` (⚠️ สำคัญ: ต้องใช้ชื่อนี้)
   - **Value**: `<API_KEY_ของคุณ>`
   - **Environment**: Production (และ Preview ถ้าต้องการ)
   - **Kind**: **Build environment variable** (⚠️ สำคัญมาก! ต้องเป็น Build ไม่ใช่ Runtime)

**หมายเหตุ**: 
- ต้องใช้ชื่อ `GEMINI_API_KEY` เพราะ Vite จะอ่านตัวนี้ตอน build
- ต้องตั้ง Kind เป็น "Build" เพราะตัวแปรนี้ถูกใช้ตอน build time ไม่ใช่ runtime
- ค่าจะถูก embed เข้าไปในโค้ดที่ build แล้ว

### ขั้นตอนที่ 5: Deploy!

หลังจากตั้งค่าเสร็จ:

1. Cloudflare จะเริ่ม build และ deploy ครั้งแรกทันที
2. ทุกครั้งที่คุณ push code ไปยัง branch `main` มันจะ deploy อัตโนมัติ
3. Pull Requests จะสร้าง Preview deployments อัตโนมัติ

## ตรวจสอบการ Deploy

- ดูสถานะ deployment ได้ที่หน้า **Deployments** ใน Cloudflare Pages
- ดู logs จาก build ได้ที่หน้า deployment แต่ละอัน
- URL ของเว็บไซต์จะแสดงที่หน้า Overview

## Build Settings ที่ใช้

- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Root directory**: `/` (root)

## หมายเหตุ

- ไฟล์ `_headers` และ `_redirects` จะถูกคัดลอกไปยัง `dist` อัตโนมัติเมื่อ build
- ตรวจสอบว่า `node_modules` อยู่ใน `.gitignore`
- ใช้ Node.js version 18 หรือสูงกว่า (Cloudflare Pages จะใช้ auto-detect)

