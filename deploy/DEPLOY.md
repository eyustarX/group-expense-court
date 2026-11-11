# 🚀 Group Expense Court - Step-by-Step Deployment Guide

This guide walks you through deploying **Group Expense Court** to production using:
- **Neon Serverless Postgres** for database storage
- **AWS SAM (Serverless Application Model)** for the backend Lambda & API Gateway
- **Amazon Textract & Bedrock** for receipt OCR and AI courtroom verdicts
- **Amazon S3** for static frontend website hosting

---

## ⚠️ Important: Set Up a Billing Alarm First!

Before provisioning any cloud resources:
1. Open the [AWS Billing & Cost Management Console](https://console.aws.amazon.com/billing/).
2. Enable **Receive Billing Alerts** in Billing Preferences.
3. In CloudWatch, create a **Billing Alarm** (e.g. threshold of **$5.00 USD**) sending to your email.
4. Keep track of Bedrock model token usage. Haiku/Nova Micro are cost-efficient.

---

## 1. Create Neon Serverless Postgres Database

1. Sign up or log in at [Neon.tech](https://neon.tech).
2. Click **Create Project**, name it `group-expense-court`, and select AWS region `us-east-1` (recommended).
3. On the Neon dashboard, locate your **Connection Details**.
4. Check **Pooled connection** (this provides an HTTP/pgbouncer pooled endpoint safe for serverless Lambda execution).
5. Copy your connection string:
   ```env
   DATABASE_URL=postgresql://court_user:password@ep-court-pooler.us-east-1.aws.neon.tech/court_db?sslmode=require
   ```

---

## 2. Run Database Migration & Seed Demo Data

Run the migration script from your local machine to create the schema and populate the demo court (`COURT-4821`):

```bash
# Set DATABASE_URL in your environment or in a root .env file
export DATABASE_URL="postgresql://court_user:password@ep-court-pooler.us-east-1.aws.neon.tech/court_db?sslmode=require"

# Run schema creation and demo seed data
node db/migrate.js --seed
```

You should see:
```text
🏛️  Group Expense Court - Database Migration
Executing schema.sql...
✅ Schema migration completed successfully.
Executing seed.sql (COURT-4821 Demo Court)...
✅ Demo seed data inserted successfully.
```

---

## 3. Enable AWS Bedrock Model Access & Permissions

1. In the AWS Management Console, navigate to **Amazon Bedrock** in `us-east-1`.
2. Go to **Model access** on the left menu.
3. Click **Enable specific models** and enable **Anthropic Claude 3 Haiku** (`anthropic.claude-3-haiku-20240307-v1:0`) or **Amazon Nova Micro**.
4. Confirm access is **Access granted**.

---

## 4. Deploy Backend with AWS SAM

Ensure AWS CLI and AWS SAM CLI are installed and configured (`aws configure`).

```bash
cd deploy

# 1. Build SAM container / zip
sam build

# 2. Deploy guided
sam deploy --guided
```

When prompted during `--guided`:
- **Stack Name**: `group-expense-court-backend`
- **AWS Region**: `us-east-1`
- **Parameter DatabaseUrl**: *[Paste your Neon pooled DATABASE_URL]*
- **Parameter BedrockModelId**: `anthropic.claude-3-haiku-20240307-v1:0`
- **Parameter FrontendOrigin**: `*` (or your S3 website URL once known)
- **Confirm changes before deploy**: `y`
- **Allow SAM CLI IAM role creation**: `y`
- **Save arguments to configuration file**: `y`

After deployment completes, note down the **CourtApiUrl** output:
```text
Outputs
--------------------------------------------------------------------------------------
Key                 CourtApiUrl
Description         HTTP API Gateway endpoint URL
Value               https://abc123xyz.execute-api.us-east-1.amazonaws.com
--------------------------------------------------------------------------------------
```

Verify backend health by calling:
```bash
curl https://abc123xyz.execute-api.us-east-1.amazonaws.com/api/health
```
Response:
```json
{"ok":true,"status":"Court is in session","neon":true}
```

---

## 5. Build and Deploy Frontend to Amazon S3

### A. Build the Frontend
In the project directory, configure the API endpoint and build:

```bash
cd ../frontend

# Set production API URL
export VITE_API_URL="https://abc123xyz.execute-api.us-east-1.amazonaws.com"

# Build static bundle to dist/
npm run build
```

### B. Create S3 Bucket and Enable Static Hosting

```bash
# 1. Create a unique S3 bucket
aws s3 mb s3://group-expense-court-habesha --region us-east-1

# 2. Configure bucket for static website hosting
aws s3 website s3://group-expense-court-habesha --index-document index.html --error-document index.html

# 3. Allow public read access via bucket policy
cat <<EOF > /tmp/s3-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::group-expense-court-habesha/*"
    }
  ]
}
EOF

# Disable public block settings
aws s3api put-public-access-block --bucket group-expense-court-habesha \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Apply policy
aws s3api put-bucket-policy --bucket group-expense-court-habesha --policy file:///tmp/s3-policy.json

# 4. Sync dist/ files to S3
aws s3 sync dist/ s3://group-expense-court-habesha/
```

### C. Access the Live App!

Open your S3 website URL in any browser:
```text
http://group-expense-court-habesha.s3-website-us-east-1.amazonaws.com
```

Your courtroom is now officially open! Enter `COURT-4821` to explore the pre-seeded Habesha Cultural Restaurant docket.
