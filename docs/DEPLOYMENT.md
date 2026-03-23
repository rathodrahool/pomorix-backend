# Deploy Pomorix Backend to EC2 with GitHub Actions CI/CD

This guide will help you deploy the **pomorix-backend** NestJS application to an EC2 instance using an automated GitHub Actions workflow.

## Prerequisites

- An AWS EC2 instance (Ubuntu AMI recommended)
- Security groups configured to allow:
  - Port 22 (SSH)
  - Port 80 (HTTP)
  - Port 443 (HTTPS - optional)
- A PostgreSQL database (can be AWS RDS or self-hosted)
- SSH key pair for EC2 access

---

## Part 1: EC2 Instance Setup

### Step 1: Update & Upgrade System Packages

SSH into your EC2 instance and run:

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Node.js and npm

```bash
# Install npm
sudo apt-get install npm -y

# Install 'n' version manager
sudo npm i -g n

# Install LTS version of Node.js
sudo n lts

# Verify installation
node --version
npm --version
```

**Important:** Exit and re-login to your EC2 instance to ensure the new Node.js version is active.

### Step 3: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### Step 4: Install PostgreSQL (If Not Using RDS)

**Skip this step if you're using AWS RDS or an external PostgreSQL database.**

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE pomorix;
CREATE USER pomorix_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE pomorix TO pomorix_user;
\q
EOF
```

### Step 5: Setup Deployment Directory

```bash
# Create application directory
sudo mkdir -p /var/www/pomorix-backend

# Set ownership to ubuntu user (adjust if using different user)
sudo chown -R ubuntu:ubuntu /var/www/pomorix-backend

# Navigate to directory
cd /var/www/pomorix-backend
```

### Step 6: Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration file
sudo nano /etc/nginx/sites-available/pomorix-backend
```

Paste the following configuration (replace `YOUR_EC2_PUBLIC_IP` with your actual IP or domain):

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;  # Replace with your IP or domain (e.g., api.pomorix.com)

    # API location
    location / {
        proxy_pass http://localhost:3000;  # Default NestJS port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

Enable the configuration:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/pomorix-backend /etc/nginx/sites-enabled/

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 7: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Generate startup script
sudo pm2 startup

# If prompted, run the suggested command (it will look like):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

## Part 2: GitHub Secrets Configuration

In your GitHub repository, navigate to **Settings → Secrets and variables → Actions → New repository secret**.

Add the following secrets:

### Required Secrets:

1. **EC2_HOST**
   - Your EC2 public IP address or domain
   - Example: `54.123.456.789` or `api.pomorix.com`

2. **EC2_USERNAME**
   - EC2 user (typically `ubuntu` for Ubuntu AMI)
   - Example: `ubuntu`

3. **EC2_SSH_KEY**
   - Your private SSH key content
   - To get the key content:
     ```bash
     # On your local machine
     cat your-ec2-key.pem
     ```
   - Copy the **entire content** including:
     ```
     -----BEGIN RSA PRIVATE KEY-----
     ... key content ...
     -----END RSA PRIVATE KEY-----
     ```

4. **DATABASE_URL** (Production database connection string)
   - Example: `postgresql://pomorix_user:password@localhost:5432/pomorix`
   - Or for RDS: `postgresql://username:password@your-rds-endpoint:5432/pomorix`

5. **JWT_SECRET** (Production JWT secret)
   - Example: `your-super-secure-production-jwt-secret-key`

6. **JWT_EXPIRES_IN** (Optional, defaults to 7d)
   - Example: `7d`

---

## Part 3: Create GitHub Actions Workflow

Create the following file in your repository: `.github/workflows/deploy.yml`

```yml
name: Deploy Pomorix Backend to EC2

on:
  push:
    branches: [main]
  workflow_dispatch: # Allows manual deployment

jobs:
  build:
    name: Build Application
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Build NestJS Application
        run: npm run build

      - name: Create deployment package
        run: |
          mkdir -p deploy
          cp -r dist deploy/
          cp -r prisma deploy/
          cp package*.json deploy/
          cp ecosystem.config.cjs deploy/
          cp .env.example deploy/
          tar -czf deploy.tar.gz -C deploy .

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: deployment-package
          path: deploy.tar.gz
          retention-days: 1

  deploy:
    name: Deploy to EC2
    needs: build
    runs-on: ubuntu-latest

    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: deployment-package

      - name: Deploy to EC2 via SSH
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
          EC2_USERNAME: ${{ secrets.EC2_USERNAME }}
          SSH_PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          JWT_EXPIRES_IN: ${{ secrets.JWT_EXPIRES_IN }}
        run: |
          # Create SSH key file
          echo "$SSH_PRIVATE_KEY" > private_key.pem
          chmod 600 private_key.pem

          # Copy deployment package to EC2
          scp -i private_key.pem -o StrictHostKeyChecking=no \
            deploy.tar.gz ${EC2_USERNAME}@${EC2_HOST}:/tmp/

          # SSH into EC2 and deploy
          ssh -i private_key.pem -o StrictHostKeyChecking=no \
            ${EC2_USERNAME}@${EC2_HOST} << 'EOF'
            
            # Navigate to app directory
            cd /var/www/pomorix-backend

            # Fix ownership
            echo "Fixing directory ownership..."
            sudo chown -R $USER:$USER /var/www/pomorix-backend
            
            # Backup current version
            if [ -d "dist" ]; then
              timestamp=$(date +%Y%m%d_%H%M%S)
              mkdir -p backups
              tar -czf backups/backup_${timestamp}.tar.gz dist package.json ecosystem.config.cjs .env prisma 2>/dev/null || true
              # Keep only last 5 backups
              ls -t backups/backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
            fi
            
            # Extract new version
            echo "Extracting new deployment package..."
            tar --overwrite -xzf /tmp/deploy.tar.gz -C /var/www/pomorix-backend
            rm /tmp/deploy.tar.gz

            # Fix ownership after extraction
            sudo chown -R $USER:$USER /var/www/pomorix-backend
            
            # Install production dependencies
            echo "Installing production dependencies..."
            npm ci --omit=dev
            
            # Generate Prisma Client
            echo "Generating Prisma Client..."
            npx prisma generate
            
            # Create .env file if needed
            if [ ! -f .env ]; then
              echo "Creating .env file..."
              cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=${{ secrets.DATABASE_URL }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
JWT_EXPIRES_IN=${{ secrets.JWT_EXPIRES_IN }}
ENVEOF
            else
              echo "Updating existing .env file..."
              # Update specific environment variables
              sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${{ secrets.DATABASE_URL }}|" .env
              sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${{ secrets.JWT_SECRET }}|" .env
            fi
            
            # Run database migrations
            echo "Running database migrations..."
            npx prisma migrate deploy
            
            # Create logs directory
            mkdir -p logs
            
            # Zero-downtime reload with PM2
            if pm2 describe pomorix-backend > /dev/null 2>&1; then
              echo "Reloading PM2 app (zero-downtime)..."
              sudo pm2 reload ecosystem.config.cjs --update-env
            else
              echo "Starting new PM2 process..."
              sudo pm2 start ecosystem.config.cjs
            fi
            
            # Save PM2 process list
            sudo pm2 save
            
            echo "✅ Deployment completed successfully!"
           
          EOF

          # Cleanup
          rm private_key.pem

      - name: Verify deployment
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
        run: |
          echo "Waiting for application to start..."
          sleep 15

          # Check if app responds (try multiple times)
          for i in {1..3}; do
            echo "Verification attempt $i of 3..."
            response=$(curl -s -o /dev/null -w "%{http_code}" http://${EC2_HOST} 2>/dev/null || echo "000")
            
            if [ "$response" = "200" ] || [ "$response" = "201" ] || [ "$response" = "301" ] || [ "$response" = "302" ] || [ "$response" = "404" ]; then
              echo "✅ Deployment successful! App is responding with status: $response"
              exit 0
            fi
            
            echo "Got response: $response, waiting 5 seconds..."
            sleep 5
          done

          echo "⚠️ Could not verify deployment automatically"
          echo "Please check PM2 logs on the server manually"
          echo "This is not necessarily an error - check your server"

      - name: Rollback on failure
        if: failure()
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
          EC2_USERNAME: ${{ secrets.EC2_USERNAME }}
          SSH_PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
        run: |
          echo "🔄 Attempting to rollback to previous version..."

          echo "$SSH_PRIVATE_KEY" > private_key.pem
          chmod 600 private_key.pem

          ssh -i private_key.pem -o StrictHostKeyChecking=no \
            ${EC2_USERNAME}@${EC2_HOST} << 'EOF'
            
            cd /var/www/pomorix-backend

            # Fix ownership
            sudo chown -R $USER:$USER /var/www/pomorix-backend
            
            # Find latest backup
            latest_backup=$(ls -t backups/backup_*.tar.gz 2>/dev/null | head -1)
            
            if [ -n "$latest_backup" ]; then
              echo "Found backup: $latest_backup"
              tar -xzf "$latest_backup" -C /var/www/pomorix-backend
              npm ci --omit=dev
              npx prisma generate
              pm2 reload ecosystem.config.cjs
              echo "✅ Rolled back to previous version"
            else
              echo "⚠️ No backup found, cannot rollback"
            fi
          EOF

          rm private_key.pem
```

---

## Part 4: Update PM2 Configuration

Update your `ecosystem.config.cjs` file:

```javascript
module.exports = {
    apps: [
        {
            name: "pomorix-backend",
            script: "./dist/src/main.js", // NestJS compiled output
            instances: "max",
            exec_mode: "cluster",
            watch: false,
            max_memory_restart: "500M",
            error_file: "./logs/err.log",
            out_file: "./logs/out.log",
            log_file: "./logs/combined.log",
            time: true,
            merge_logs: true,
            autorestart: true,
            max_restarts: 10,
            min_uptime: "10s",
            env: {
                NODE_ENV: "production",
                PORT: 3000,
            },
        },
    ],
};
```

---

## Part 5: Initial Manual Deployment (First Time Only)

For the first deployment, SSH into your EC2 instance and run these commands manually:

```bash
cd /var/www/pomorix-backend

# Create a basic .env file
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://pomorix_user:password@localhost:5432/pomorix
JWT_SECRET=your-production-jwt-secret-here
JWT_EXPIRES_IN=7d
EOF

# Start the app with PM2
sudo pm2 start ecosystem.config.cjs

# Save PM2 configuration
sudo pm2 save
```

---

## Part 6: Deploy and Monitor

### Deploy Your Application

1. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Or trigger manual deployment:**
   - Go to your GitHub repository
   - Click **Actions** tab
   - Select **Deploy Pomorix Backend to EC2** workflow
   - Click **Run workflow**

### Monitor Your Application

SSH into your EC2 instance and use these PM2 commands:

```bash
# View all PM2 processes
sudo pm2 list

# Monitor real-time logs
sudo pm2 logs pomorix-backend

# Monitor CPU/Memory usage
sudo pm2 monit

# Restart the application
sudo pm2 restart pomorix-backend

# Stop the application
sudo pm2 stop pomorix-backend

# View detailed info
sudo pm2 info pomorix-backend
```

---

## Troubleshooting

### Issue: Application not starting

```bash
# Check PM2 logs
sudo pm2 logs pomorix-backend --lines 100

# Check if port is in use
sudo lsof -i :3000

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Issue: Database connection error

```bash
# Test database connection
psql -U pomorix_user -d pomorix -h localhost

# Check .env file
cat /var/www/pomorix-backend/.env
```

### Issue: Nginx not forwarding requests

```bash
# Check Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx
```

### Issue: Prisma migrations failing

```bash
cd /var/www/pomorix-backend

# Reset Prisma (⚠️ This will delete all data!)
npx prisma migrate reset

# Or just deploy pending migrations
npx prisma migrate deploy
```

---

## Optional: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d api.pomorix.com

# Auto-renewal is set up automatically
# Test renewal:
sudo certbot renew --dry-run
```

---

## Summary

You now have:
- ✅ NestJS application running on EC2
- ✅ PM2 managing your application process
- ✅ Nginx as reverse proxy
- ✅ Automated deployments via GitHub Actions
- ✅ Zero-downtime deployments
- ✅ Automatic rollback on failure
- ✅ Production-ready PostgreSQL database

Your **pomorix-backend** is now deployed and ready to serve requests! 🚀


actual file of youtuber : 


## Deploy the Node.js backend to an EC2 instance using an automated GitHub Actions CI/CD workflow

After setting up the EC2 instance and configuring security groups, follow these steps to deploy the application:

#### Setp 1: First update & upgrade the packages on your EC2 instance:

```bash
sudo apt update && sudo apt upgrade -y
```

#### Step 2: Install Node.js and npm on your EC2 instance:

```bash
sudo apt-get install npm -y
sudo npm i -g n
sudo n lts # sudo n 22.0.1
```

**After that exit your instance and relogin to check the new node js version**

#### Step 3: Now Install the Nginx server on your EC2 instance:

```bash
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

```

#### Step 4: Setup Deployment Directory Structure

```bash
# Create app directory
sudo mkdir -p /var/www/express-app
# If you want to set ownership to ubuntu user
# sudo chown -R ubuntu:ubuntu /var/www/express-app
cd /var/www/express-app
```

#### Step 5: Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration file
sudo nano /etc/nginx/sites-available/express-app
```

##### Paste the following configuration:

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;  # Replace with your IP or domain

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

```

##### Enable the Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/express-app /etc/nginx/sites-enabled/

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 6: install PM2 to manage the Node.js application

```bash
sudo npm install -g pm2

## Generate the start script using PM2
sudo pm2 startup
```

After this run your application using PM2 in the deployment script and use this command to start the server with PM2:

```bash
sudo pm2 start ecosystem.config.js

## Save the PM2
sudo pm2 save
```

#### Step 7: Create GitHub Secrets for Deployment

In your GitHub repository, go to Settings → Secrets and variables → Actions → New repository secret.

Add These Secrets

**EC2_HOST - Your EC2 public IP address:**
**EC2_USERNAME - EC2 user (ubuntu for Ubuntu AMI):**
**EC2_SSH_KEY - Your private SSH key content:**

```bash
# On your local machine, copy the entire key
cat ec2-deploy-key.pem

# Copy ALL content including:
# -----BEGIN RSA PRIVATE KEY-----
# ... key content ...
# -----END RSA PRIVATE KEY-----
```

#### Step 8: Create GitHub Actions Workflow

In your repository, create .github/workflows/deploy.yml

```yml
name: Deploy to EC2

on:
  push:
    branches: [main]
  workflow_dispatch: # manual trigger

jobs:
  build:
    name: Build Application
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20.13.1"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build TypeScript
        run: npm run build

      - name: Create deployment package (without node_modules)
        run: |
          mkdir -p deploy
          cp -r dist deploy/
          cp -r src deploy/
          cp package*.json deploy/
          cp ecosystem.config.cjs deploy/
          # Copy .env.example if exists
          [ -f .env.example ] && cp .env.example deploy/ || echo "No .env.example found"
          tar -czf deploy.tar.gz -C deploy .

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: deployment-package
          path: deploy.tar.gz
          retention-days: 1

  deploy:
    name: Deploy to EC2
    needs: build
    runs-on: ubuntu-latest

    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: deployment-package

      - name: Deploy to EC2 via SSH
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
          EC2_USERNAME: ${{ secrets.EC2_USERNAME }}
          SSH_PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
        run: |
          # Create SSH key file
          echo "$SSH_PRIVATE_KEY" > private_key.pem
          chmod 600 private_key.pem

          # Copy deployment package to EC2
          scp -i private_key.pem -o StrictHostKeyChecking=no \
            deploy.tar.gz ${EC2_USERNAME}@${EC2_HOST}:/tmp/

          # SSH into EC2 and deploy
          ssh -i private_key.pem -o StrictHostKeyChecking=no \
            ${EC2_USERNAME}@${EC2_HOST} << 'EOF'
            
            # Navigate to app directory
            cd /var/www/express-app

            # Fix ownership first (important!)
            echo "Fixing directory ownership..."
            sudo chown -R $USER:$USER /var/www/express-app
            
            
            # Backup current version
            if [ -d "dist" ]; then
              timestamp=$(date +%Y%m%d_%H%M%S)
              mkdir -p backups
              tar -czf backups/backup_${timestamp}.tar.gz dist package.json ecosystem.config.cjs .env 2>/dev/null || true
              # Keep only last 5 backups
              ls -t backups/backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
            fi
            
            # Extract new version (this will overwrite existing files)
            echo "Extracting new deployment package..."
            tar --overwrite -xzf /tmp/deploy.tar.gz -C /var/www/express-app
            rm /tmp/deploy.tar.gz

            # Fix ownership after extraction
            sudo chown -R $USER:$USER /var/www/express-app
            
            
            # Install production dependencies on the server
            echo ""
            echo "Installing production dependencies..."
            npm ci
            
            # Create .env file if needed (only on first deploy)
            if [ ! -f .env ]; then
              echo "Creating default .env file..."
              echo "NODE_ENV=production" > .env
              echo "PORT=8000" >> .env
            fi
            
            # Create logs directory
            mkdir -p logs
            
            # Zero-downtime reload with PM2
            if pm2 describe express-app > /dev/null 2>&1; then
              echo "Reloading PM2 app (zero-downtime)..."
              sudo pm2 reload ecosystem.config.cjs --update-env
            else
              echo "Starting new PM2 process..."
              sudo pm2 start ecosystem.config.cjs
            fi
            
            # Save PM2 process list
            sudo pm2 save
           
          EOF

          # Cleanup
          rm private_key.pem

      - name: Verify deployment
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
        run: |
          echo "Waiting for application to start..."
          sleep 10

          # Check if app responds via nginx (try multiple times)
          for i in {1..2}; do
            echo "Attempt $i of 2..."
            response=$(curl -s -o /dev/null -w "%{http_code}" http://${EC2_HOST} 2>/dev/null || echo "000")
            
            if [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
              echo "✅ Deployment successful! App is responding with status: $response"
              exit 0
            fi
            
            echo "Got response: $response, waiting 5 seconds..."
            sleep 5
          done

          echo "❌ Deployment verification failed after 2 attempts"
          echo "Please check PM2 logs on the server"
          exit 1

      - name: Rollback on failure
        if: failure()
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
          EC2_USERNAME: ${{ secrets.EC2_USERNAME }}
          SSH_PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
        run: |
          echo "🔄 Attempting to rollback to previous version..."

          echo "$SSH_PRIVATE_KEY" > private_key.pem
          chmod 600 private_key.pem

          ssh -i private_key.pem -o StrictHostKeyChecking=no \
            ${EC2_USERNAME}@${EC2_HOST} << 'EOF'
            
            cd /var/www/express-app

            # Fix ownership first (important!)
            sudo chown -R $USER:$USER /var/www/express-app
            
            # Find latest backup
            latest_backup=$(ls -t backups/backup_*.tar.gz 2>/dev/null | head -1)
            
            if [ -n "$latest_backup" ]; then
              echo "Found backup: $latest_backup"
              tar -xzf "$latest_backup" -C /var/www/express-app
              npm ci
              pm2 reload ecosystem.config.cjs
              echo "✅ Rolled back to previous version"
            else
              echo "⚠️ No backup found, cannot rollback"
            fi
          EOF

          rm private_key.pem
```
