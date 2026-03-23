# Quick Deployment Reference

## GitHub Secrets Required

Add these in **GitHub Repository Settings → Secrets and variables → Actions**:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `EC2_HOST` | EC2 public IP or domain | `54.123.456.789` or `api.pomorix.com` |
| `EC2_USERNAME` | EC2 SSH username | `ubuntu` |
| `EC2_SSH_KEY` | Private SSH key content | Full content of `.pem` file |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/pomorix` |
| `JWT_SECRET` | Production JWT secret | `your-secure-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |

---

## Common PM2 Commands

```bash
# SSH into your EC2 instance first
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# View all processes
sudo pm2 list

# View logs (real-time)
sudo pm2 logs pomorix-backend

# View last 100 lines of logs
sudo pm2 logs pomorix-backend --lines 100

# Monitor CPU/Memory
sudo pm2 monit

# Restart application
sudo pm2 restart pomorix-backend

# Stop application
sudo pm2 stop pomorix-backend

# Start application
sudo pm2 start ecosystem.config.cjs

# Reload application (zero-downtime)
sudo pm2 reload pomorix-backend

# Delete from PM2
sudo pm2 delete pomorix-backend

# Save PM2 configuration
sudo pm2 save
```

---

## Common Nginx Commands

```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx (no downtime)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

---

## Database Management

```bash
# Navigate to app directory
cd /var/www/pomorix-backend

# Run pending migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (in development)
npx prisma studio

# Reset database (⚠️ DELETES ALL DATA!)
npx prisma migrate reset

# Connect to PostgreSQL
psql -U pomorix_user -d pomorix -h localhost
```

---

## Deployment Checklist

### Initial Setup (One-time)
- [ ] EC2 instance created and running
- [ ] Security groups allow ports 22, 80, 443
- [ ] Node.js and npm installed
- [ ] Nginx installed and configured
- [ ] PostgreSQL database set up
- [ ] PM2 installed globally
- [ ] Directory `/var/www/pomorix-backend` created
- [ ] GitHub secrets configured
- [ ] SSL certificate installed (optional)

### Every Deployment
- [ ] Code changes committed and pushed
- [ ] GitHub Actions workflow runs successfully
- [ ] Application responds to HTTP requests
- [ ] PM2 shows app running: `sudo pm2 list`
- [ ] Logs show no errors: `sudo pm2 logs pomorix-backend`
- [ ] Database migrations applied
- [ ] Test API endpoints

---

## Troubleshooting

### Application won't start

```bash
# Check PM2 logs
sudo pm2 logs pomorix-backend --lines 50

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart the app
sudo pm2 restart pomorix-backend

# Check .env file exists
ls -la /var/www/pomorix-backend/.env
cat /var/www/pomorix-backend/.env
```

### Database connection errors

```bash
# Test PostgreSQL connection
psql -U pomorix_user -d pomorix -h localhost

# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check DATABASE_URL in .env
cat /var/www/pomorix-backend/.env | grep DATABASE_URL
```

### Nginx not forwarding requests

```bash
# Test Nginx config
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx

# Check if app is listening on port 3000
curl http://localhost:3000
```

### Deployment failed in GitHub Actions

1. Check GitHub Actions logs in the **Actions** tab
2. Verify all GitHub secrets are set correctly
3. Ensure EC2 instance is running
4. Check SSH key has correct permissions (600)
5. Verify security groups allow SSH (port 22)

---

## Rollback to Previous Version

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Navigate to app directory
cd /var/www/pomorix-backend

# List available backups
ls -lh backups/

# Extract a specific backup (replace with actual filename)
tar -xzf backups/backup_20260113_153000.tar.gz -C /var/www/pomorix-backend

# Install dependencies
npm ci --omit=dev

# Generate Prisma Client
npx prisma generate

# Reload PM2
sudo pm2 reload ecosystem.config.cjs
```

---

## Monitoring and Logs

### Application Logs
```bash
# Real-time logs
sudo pm2 logs pomorix-backend

# Error logs only
sudo tail -f /var/www/pomorix-backend/logs/err.log

# Output logs
sudo tail -f /var/www/pomorix-backend/logs/out.log

# Combined logs
sudo tail -f /var/www/pomorix-backend/logs/combined.log
```

### System Resources
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# PM2 monitoring
sudo pm2 monit
```

---

## Environment Variables

Edit the `.env` file on the server:

```bash
# Navigate to app directory
cd /var/www/pomorix-backend

# Edit .env file
nano .env

# After editing, reload PM2
sudo pm2 reload pomorix-backend --update-env
```

Required variables:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/pomorix
JWT_SECRET=your-production-secret
JWT_EXPIRES_IN=7d
```

---

## SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d api.pomorix.com

# Test auto-renewal
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal
```

---

## Useful File Locations

| Item | Path |
|------|------|
| Application Root | `/var/www/pomorix-backend` |
| Application Logs | `/var/www/pomorix-backend/logs/` |
| Nginx Config | `/etc/nginx/sites-available/pomorix-backend` |
| Nginx Error Logs | `/var/log/nginx/error.log` |
| Nginx Access Logs | `/var/log/nginx/access.log` |
| PM2 Config | `/var/www/pomorix-backend/ecosystem.config.cjs` |
| Environment File | `/var/www/pomorix-backend/.env` |
| Backups | `/var/www/pomorix-backend/backups/` |

---

## Manual Deployment (Without GitHub Actions)

```bash
# On your local machine
npm ci
npm run build
tar -czf deploy.tar.gz dist/ prisma/ package*.json ecosystem.config.cjs .env.example

# Copy to EC2
scp -i your-key.pem deploy.tar.gz ubuntu@YOUR_EC2_IP:/tmp/

# SSH into EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Extract and deploy
cd /var/www/pomorix-backend
tar -xzf /tmp/deploy.tar.gz
npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy
sudo pm2 reload ecosystem.config.cjs
```

---

## Need Help?

- **PM2 Documentation**: https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/
- **NestJS Documentation**: https://docs.nestjs.com/
- **Prisma Documentation**: https://www.prisma.io/docs/
- **Nginx Documentation**: https://nginx.org/en/docs/

---

**Last Updated**: January 2026
