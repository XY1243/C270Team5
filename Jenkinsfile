pipeline {
    agent any

    stages {
        stage('1. Checkout Code') {
            steps {
                echo 'Pulling code from GitHub...'
                checkout scm
            }
        }

        stage('2. Build Docker Image') {
            steps {
                echo 'Building Docker container...'
                sh 'docker build -t node-app .'
            }
        }

        stage('3. Run Tests') {
            steps {
                echo 'Running automated tests...'
                sh 'npm test'
            }
        }
    }

    post {
        success {
            echo 'Pipeline execution successful!'
        }
        failure {
            echo 'Pipeline failed. Check build logs.'
        }
    }
}
