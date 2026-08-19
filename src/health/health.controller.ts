export class HealthController {
  getHealth() {
    return {
      status: 'ok',
      api: true,
      mysql: 'pending'
    };
  }
}
