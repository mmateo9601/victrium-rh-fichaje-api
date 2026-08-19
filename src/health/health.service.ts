export class HealthService {
  check() {
    return {
      api: true,
      mysql: 'pending'
    };
  }
}
