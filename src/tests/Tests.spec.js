import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getContactsDuration = new Trend('get_contacts', true);
export const RateContentOK = new Rate('content_OK');

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<5700'], // 95% das respostas abaixo de 5700ms
    http_req_failed: ['rate<0.12'] // Menos de 12% de erro
  },
  stages: [
    { duration: '1m', target: 10 }, // Sobe para 10 VUs em 1 minuto
    { duration: '3m', target: 300 }, // Sobe gradualmente para 300 VUs em 3 minutos
    { duration: '1m', target: 0 } // Faz o ramp-down (descida) em 1 minuto
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://fakestoreapi.com/users';

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const OK = 200;

  const res = http.get(`${baseUrl}`, params);

  getContactsDuration.add(res.timings.duration);

  RateContentOK.add(res.status === OK);

  check(res, {
    'GET Contacts - Status 200': () => res.status === OK
  });
}
