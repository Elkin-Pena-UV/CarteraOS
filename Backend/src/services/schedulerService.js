// src/services/schedulerService.js
const schedulerService = {
    jobs: [],
    stopAll() {
        this.jobs.forEach(job => job.stop());
        this.jobs = [];
        console.log('Todos los schedulers detenidos.');
    }
};

export default schedulerService;