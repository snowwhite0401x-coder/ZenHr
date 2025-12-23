# 🚀 วิธี Deploy แบบง่าย (แนะนำ)

## วิธีที่ 1: ใช้ Git Integration (แนะนำที่สุด) ⭐

### ทำไมควรใช้?
- ✅ ไม่มีปัญหาเรื่องไฟล์เกิน 1000 ไฟล์
- ✅ Deploy อัตโนมัติทุกครั้งที่ push code
- ✅ Cloudflare จะ build ให้อัตโนมัติ
- ✅ ไม่ต้องจัดการ dist folder เอง

---

### ขั้นตอน (ใช้เวลา 5 นาที):

#### 1. สร้าง Git Repository บน GitHub

1. ไปที่ https://github.com
2. คลิก **New repository**
3. ตั้งชื่อ repository: `zenhr-leave-manager`
4. เลือก **Public** หรือ **Private**
5. **อย่า** check "Add README" หรืออื่นๆ
6. คลิก **Create repository**

#### 2. Push โค้ดไปยัง GitHub

เปิด PowerShell หรือ Terminal ในโปรเจคของคุณ แล้วรัน:

```powershell
# ถ้ายังไม่มี git repository
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/zenhr-leave-manager.git
git push -u origin main
```

**หมายเหตุ**: แทน `USERNAME` ด้วย GitHub username ของคุณ

#### 3. เชื่อมต่อกับ Cloudflare Pages

1. ไปที่ https://dash.cloudflare.com/
2. เลือก **Workers & Pages** → **Pages**
3. คลิก **Create a project**
4. เลือก **Connect to Git**
5. เลือก **GitHub** (หรือ GitLab/Bitbucket)
6. อนุญาตให้ Cloudflare เข้าถึง repository
7. เลือก repository `zenhr-leave-manager`

#### 4. ตั้งค่า Build

ในหน้า Setup ให้ตั้งค่า:

- **Project name**: `zenhr-leave-manager`
- **Production branch**: `main`
- **Framework preset**: `Vite` (หรือเลือก None แล้วตั้งค่าต่างๆ ด้านล่าง)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (root)

#### 5. ตั้งค่า Environment Variables (ถ้ามี)

ถ้าใช้ `GEMINI_API_KEY`:

1. คลิก **Environment variables**
2. คลิก **+ Add variable**
3. ตั้งค่า:
   - **Type**: Secret
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `<API_KEY_ของคุณ>`
   - **Environment**: Production (และ Preview ถ้าต้องการ)
   - **Kind**: **Build environment variable** ⚠️ สำคัญ!

#### 6. Deploy!

คลิก **Save and Deploy** - Cloudflare จะ build และ deploy ให้อัตโนมัติ!

---

## วิธีที่ 2: ใช้ Wrangler CLI (สำหรับ Manual Upload ที่มีไฟล์เยอะ)

หากต้องการอัพโหลดแบบ manual แต่มีไฟล์เยอะ:

### ติดตั้ง Wrangler:

```powershell
npm install -g wrangler
```

### Login:

```powershell
wrangler login
```

### Deploy:

```powershell
# Build ก่อน
npm run build

# Deploy
wrangler pages deploy dist --project-name=zenhr
```

---

## ⚠️ เปรียบเทียบ

| วิธี | ไฟล์ Limit | Build | Deploy อัตโนมัติ |
|------|------------|-------|-----------------|
| Manual Upload | 1,000 ไฟล์ | ต้องทำเอง | ❌ |
| Wrangler CLI | 20,000 ไฟล์ | ต้องทำเอง | ❌ |
| **Git Integration** | **ไม่จำกัด** | **อัตโนมัติ** | **✅** |

**แนะนำ: ใช้ Git Integration!** 🎯

