Road Inspector IOT & AI – Intelligent Road Infrastructure Monitoring & Maintenance System

Project Information

Project Title: AI & IoT-Based Road Defect Detection and Intelligent Repair Estimation System
Project Name: Road Inspector AI
Project ID: R26-IT-ROAD-023
Module: PP1 Research Project
Institute: Sri Lanka Institute of Information Technology (SLIIT)

Group Members
Student ID	Specialization Area
IT22082756	AI-Based Road Defect Detection & Risk Assessment
IT22252340	AI-Based Repair Area Estimation using Semantic Segmentation
IT22207968	Environmental & Traffic Analysis with Repair Scheduling and Alternate Route Recommendation
IT22113122	Automated Material Requirement Estimation for Road Repairs

Project Overview

Road Inspector AI is a microservices-based AI-powered intelligent road infrastructure monitoring and maintenance platform developed using Artificial Intelligence, Computer Vision, Machine Learning, IoT technologies, and Web Technologies.

The system is designed to modernize road inspection and maintenance operations by automating road defect detection, repair area estimation, traffic-aware repair scheduling, and material estimation processes.

The platform integrates:

AI-powered road defect detection
Semantic segmentation-based repair area estimation
Traffic and environmental intelligence
Smart repair scheduling
Automated material estimation
Real-time analytics dashboards
AI-generated inspection reports
IoT-enabled road image acquisition

This research aims to reduce manual road inspection processes, improve repair accuracy, reduce maintenance costs, and enhance road safety through intelligent automation.

Research Problem

Traditional road inspection and maintenance systems in many developing countries, including Sri Lanka, still rely heavily on manual inspection methods and human decision-making.

This creates several operational challenges such as:

Delayed road defect identification
Inaccurate repair estimations
Lack of intelligent maintenance planning
Poor repair scheduling
Increased traffic congestion during repairs
High maintenance costs
Lack of centralized infrastructure monitoring systems
Reduced road safety and accident prevention

Current systems lack integration between:

AI defect detection
repair area estimation
environmental intelligence
repair planning
material estimation

Road Inspector AI addresses these challenges through a unified AI-driven intelligent road monitoring and maintenance platform.

Proposed Solution

The proposed system introduces a centralized AI-powered road infrastructure inspection and maintenance decision support system.

Main features include:

AI-powered road defect detection
Real-time pothole and crack analysis
Semantic segmentation-based repair area estimation
Severity classification and risk analysis
Smart repair scheduling
Environmental and traffic-aware repair planning
Alternate route recommendation
Automated repair material estimation
AI-generated engineering inspection reports
Web-based real-time analytics dashboard

Overall System Architecture

IoT Cameras / Mobile Uploads
                ↓
        React Frontend Dashboard
                ↓
        API Gateway (Node.js)
                ↓
      Microservices Architecture
 ├── Authentication Service
 ├── Detection Service
 ├── Segmentation Service
 ├── Scheduling Service
 ├── Material Estimation Service
 └── Analytics Service
                ↓
        AI / ML Processing Engine
 ├── YOLOv8
 ├── U-Net
 ├── CNN
 ├── Random Forest
 └── Traffic Prediction Models
                ↓
 MongoDB Database + AI Model Storage

Technology Stack

Frontend
React.js
Vite
Tailwind CSS
Axios
Framer Motion

Backend
Node.js
Express.js
FastAPI

Database
MongoDB Atlas

Artificial Intelligence & Machine Learning

Python
TensorFlow
PyTorch
OpenCV
YOLOv8
U-Net
CNN
Random Forest

Deployment & Tools
Docker
Docker Compose
Git & GitHub
Google Colab
Hugging Face
Postman

System Modules
1. AI-Based Road Defect Detection & Risk Assessment
Researcher:

IT22082756

Features

AI-based pothole detection
Crack detection
Surface erosion detection
Road surface classification
Severity classification
Risk assessment analysis
AI-generated inspection report
Real-time image analysis

Defects Detected
Potholes
Longitudinal Cracks
Transverse Cracks
Alligator Cracks
Surface Erosion
Surface Damage
Rutting

AI Models Used
YOLOv8
CNN

Outputs
Bounding boxes
Confidence score
Severity level
Accident risk probability
AI inspection report

2. AI-Based Repair Area Estimation using Semantic Segmentation

Researcher:IT22252340

Features
Semantic segmentation-based damage isolation
Pixel-level repair area estimation
Major/minor damage classification
Repair strategy recommendation
Segmented repair visualization
Real-world repair area calculation

Repair Strategies

Minor Damage

Crack sealing
Surface patching

Major Damage

Full-depth patching
Partial reconstruction

AI Models Used
U-Net
YOLOv8-Seg

Outputs
Binary segmentation masks
Repair area calculation
Suggested repair method
Safety expansion factor

3. Environmental & Traffic Analysis with Repair Scheduling and Alternate Route Recommendation
Researcher:IT22207968

Features
Traffic density analysis
Environmental monitoring
Smart repair scheduling
Alternate route recommendation
Weather-aware repair planning
Traffic congestion prediction

Functions

Peak traffic analysis
Low-congestion repair scheduling
Weather-based maintenance optimization
GIS/GPS integration

AI Models Used

Random Forest
Traffic Prediction Algorithms
Rule-Based Scheduling Models

4. Automated Material Requirement Estimation for Road Repairs
Researcher:IT22113122

Features

Material quantity estimation
Asphalt requirement calculation
Repair cost estimation
Volumetric analysis
Equipment recommendation
Final engineering repair report generation

Estimated Materials

Asphalt
Gravel
Cement
Fill materials

Outputs

Repair material quantities
Estimated repair costs
Equipment requirements
Maintenance planning report

Implemented First Phase

Landing Page
Authentication System
Protected Dashboard
MongoDB Integration
AI Detection Module UI
Report Generation System
React Frontend Development
REST API Architecture
Detection Dashboard
Segmentation Workflow UI

Current Project Progress

Component                 	Progress

Dataset Collection	            75%
Frontend Development	          85%
AI Model Training	              70%
Backend APIs                  	75%
Dashboard Integration	          70%
System Integration	            60%
Testing                       	65%

Security Features

JWT Authentication
Protected API Routes
Secure Environment Variables
Database Access Protection
Token-Based Authorization
Backend AI API Security

Project Folder Structure

Road-Inspector-AI/
│
├── frontend/
│
├── backend/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── detection-service/
│   ├── segmentation-service/
│   ├── scheduling-service/
│   ├── material-service/
│   └── shared/
│
├── AI-Models/
│
├── datasets/
│
├── predictions/
│
├── reports/
│
├── documentation/
│
└── README.md

Environment Setup

Required Environment Variables

MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
AI_MODEL_PATH=
HF_TOKEN=

Run Without Docker

Frontend

cd frontend
npm install
npm run dev

Backend

cd backend
npm install
npm run dev

FastAPI AI Service
uvicorn app:app --reload

Run With Docker
docker compose up --build

Access Services

Frontend

http://localhost:5173

Backend API
http://localhost:5000

AI Models Used

Model	             Purpose
YOLOv8	           Road defect detection
U-Net         	   Semantic segmentation
CNN	               Image classification
Random Forest	     Traffic & environmental analysis
OpenCV	           Image preprocessing

Key Functional Requirements

User Authentication
Road Image Upload
AI Defect Detection
Severity Classification
Semantic Segmentation
Repair Area Estimation
Traffic Analysis
Smart Repair Scheduling
Alternate Route Recommendation
Material Estimation
AI Report Generation
Analytics Dashboard

Non-Functional Requirements

High Detection Accuracy
Fast Response Time
User-Friendly UI
Scalable Architecture
Secure System Design
Real-Time Monitoring
Responsive Web Interface

Research Contribution

Road Inspector AI introduces a novel integrated intelligent infrastructure monitoring platform by combining:

AI-based road defect detection
Semantic segmentation-based repair estimation
Environmental intelligence
Traffic-aware scheduling
Automated repair material estimation
Unified AI analytics dashboard

into one centralized intelligent road maintenance ecosystem.

The system contributes toward:

smart city infrastructure development
intelligent transportation systems
AI-driven public infrastructure maintenance

References
YOLOv8 Documentation
TensorFlow Documentation
MongoDB Documentation
OpenCV Documentation
U-Net Research Papers
FastAPI Documentation
React.js Documentation
Road Damage Dataset (RDD2022)

License

This project is developed for academic and research purposes under SLIIT.

GitHub Repository

Add your GitHub repository link here.

Example:

https://github.com/AmashaNethmi/road-inspector

Conclusion

Road Inspector AI aims to modernize road infrastructure monitoring and maintenance using Artificial Intelligence, IoT systems, semantic segmentation, and intelligent analytics.

The platform improves:

road safety
repair planning accuracy
maintenance efficiency
traffic management
infrastructure decision-making

through intelligent automation and AI-powered engineering analysis
