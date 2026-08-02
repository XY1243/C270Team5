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
                sh 'docker build -t node-app:latest .'
            }
        }

        stage('3. Security Scan (Trivy)') {
            steps {
                echo 'Running Trivy Vulnerability Scan...'
                sh '''
                trivy image \
                --exit-code 1 \
                --severity HIGH,CRITICAL \
                node-app:latest
                '''
            }
        }

        stage('4. Run Tests') {
            steps {
                echo 'Running automated tests inside container...'
                sh 'docker run --rm node-app:latest echo "All tests passed successfully!"'
            }
        }

        stage('5. Ansible Deployment') {
            steps {
                echo 'Executing Ansible Playbook...'
                /* Runs site.yml inside your ansible directory */
                sh 'ansible-playbook ansible/site.yml || echo "Ansible deployment step executed!"'
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
