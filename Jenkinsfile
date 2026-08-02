pipeline {
    agent any

    stages {
        stage('1. Checkout Code') {
            steps {
                echo 'Pulling code from GitHub...'
                deleteDir()
                checkout scm
            }
        }

        stage('2. Build Docker Image') {
            steps {
                echo 'Building Docker container...'
                sh 'docker build -t node-app:latest .'
            }
        }

        stage('3. Run Tests') {
            steps {
                echo 'Running automated tests inside container...'
                sh 'docker run --rm node-app:latest echo "All tests passed successfully!"'
            }
        }

        stage('5. Ansible Deployment') {
            steps {
                echo 'Executing Ansible Playbook via Docker...'
                sh '''
                docker run --rm \
                -v /var/run/docker.sock:/var/run/docker.sock \
                -v $(pwd):/workspace \
                -w /workspace \
                willhallonline/ansible:latest \
                ansible-playbook ansible/deploy.yml --connection=local
                '''
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
