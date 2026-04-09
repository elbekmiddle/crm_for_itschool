# Ubuntu server (Google Cloud VM): to‘liq o‘rnatish

**Faraz**: Ubuntu 22.04/24.04 LTS, `sudo` huquqi, domenlar DNS da VM tashqi IP ga yo‘naltirilgan (`api`, `app`, `exam` A yozuvlari).

O‘z domeningizni barcha `api.sizning-domen.uz` kabi joylarda almashtiring.

---

## 1. Tizim va firewall (UFW)

SSH sessiyangiz ochiq turganida bajaring — aks holda o‘zingizni qulfdan chiqarib yubormaysiz.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ufw

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```

**GCP**: VPC → Firewall rules da ham 80/443 ochiq bo‘lishi kerak (yoki VM yaratishda “Allow HTTP/HTTPS”).

---

## 2. Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

Konfig namuna repoda: `deploy/nginx/itschool-subdomains.conf.example`.

```bash
sudo mkdir -p /var/www/certbot
sudo cp /var/www/crm_for_itschool/deploy/nginx/itschool-subdomains.conf.example /etc/nginx/sites-available/itschool
sudo nano /etc/nginx/sites-available/itschool
```

`server_name` va `root` (`/var/www/crm/dist`, `/var/www/exam-platform/dist`) ni to‘g‘rilang. SSL qatorlari hozircha izohda qolishi mumkin — keyin certbot qo‘shadi.

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/itschool /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 3. Node.js (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential
node -v && npm -v
```

---

## 4. PM2 (Nest doimiy ishlashi uchun)

```bash
sudo npm install -g pm2
```

---

## 5. GitHub dan loyiha

**Ochiq repo** bo‘lsa:

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone -b dev https://github.com/elbekmiddle/crm_for_itschool.git
cd crm_for_itschool
```

**Yopiq repo** yoki push/pull kerak bo‘lsa: serverda SSH kalit yarating, GitHub → Deploy keys yoki SSH key qo‘shing, keyin:

```bash
git clone -b dev git@github.com:elbekmiddle/crm_for_itschool.git
```

---

## 6. PostgreSQL

**Variant A — VM da PostgreSQL**

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE USER crm_user WITH PASSWORD 'KUCHLI_PAROL';"
sudo -u postgres psql -c "CREATE DATABASE crm_db OWNER crm_user;"
```

**Variant B — Cloud SQL** bo‘lsa, faqat `backend/.env` da `DB_HOST` (instance connection name yoki IP), user, parol.

---

## 7. Backend (Nest)

```bash
cd /var/www/crm_for_itschool/backend
cp .env.example .env
nano .env
```

To‘ldiring: `DB_*`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT=5001`, `NODE_ENV=production`, `ALLOWED_ORIGINS=https://app.sizning-domen.uz,https://exam.sizning-domen.uz`, Redis/Telegram/OpenAI ixtiyoriy.

```bash
npm ci
npm run build
npm run db:migrate
```

Ishga tushirish:

```bash
cd /var/www/crm_for_itschool/backend
pm2 start dist/main.js --name crm-api
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

( `pm2 startup` chiqarilgan buyruqni sudo bilan bir marta bajaring.)

Tekshiruv: `curl -s http://127.0.0.1:5001/api/v1/health`

---

## 8. Frontend (CRM) va exam-platform

**CRM**

```bash
cd /var/www/crm_for_itschool/frontend
printf '%s\n' \
  'VITE_API_URL=https://api.sizning-domen.uz/api/v1' \
  'VITE_SOCKET_URL=https://api.sizning-domen.uz' \
  > .env.production
npm ci
npm run build
sudo mkdir -p /var/www/crm
sudo rsync -a --delete dist/ /var/www/crm/dist/
```

**Exam-platform**

```bash
cd /var/www/crm_for_itschool/exam-platform
printf '%s\n' \
  'VITE_API_URL=https://api.sizning-domen.uz/api/v1' \
  'VITE_SOCKET_URL=https://api.sizning-domen.uz' \
  > .env.production
npm ci
npm run build
sudo mkdir -p /var/www/exam-platform
sudo rsync -a --delete dist/ /var/www/exam-platform/dist/
```

Nginx `root` lar shu papkalarga mos bo‘lishi kerak.

---

## 9. HTTPS (Let’s Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.sizning-domen.uz -d app.sizning-domen.uz -d exam.sizning-domen.uz
```

Certbot nginx bloklarga SSL qo‘shadi. Keyin:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Avtomatik yangilanish: `sudo certbot renew --dry-run`

---

## 10. Yangilash (keyingi deploy)

```bash
cd /var/www/crm_for_itschool
git pull origin dev

cd backend && npm ci && npm run build && npm run db:migrate && pm2 restart crm-api

cd ../frontend && npm ci && npm run build && sudo rsync -a --delete dist/ /var/www/crm/dist/
cd ../exam-platform && npm ci && npm run build && sudo rsync -a --delete dist/ /var/www/exam-platform/dist/
```

`.env` / `.env.production` odatda `git pull` dan keyin qo‘lda saqlanadi (commit qilinmagan).

---

## Muammolar

| Simptom | Tekshirish |
|--------|------------|
| 502 Bad Gateway | `pm2 status`, `pm2 logs crm-api`, `curl 127.0.0.1:5001/api/v1/health` |
| CORS | `ALLOWED_ORIGINS` da aniq `https://app...` (protokol + domen) |
| WebSocket | Nginx da `Upgrade` / `Connection` (namuna faylda bor), `VITE_SOCKET_URL=https://api...` |
| 401 / login | Vaqt zonasi, cookie `Secure` — faqat HTTPS orqali kirish |

Qisqa yo‘l: `PRODUCTION.md` va `deploy/nginx/*.example` bilan birga o‘qing.
