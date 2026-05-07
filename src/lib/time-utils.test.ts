import { describe, it, expect } from 'vitest';
import {
  paraMinutos,
  paraHora,
  fmtHora,
  calcularMinutosTrabalhados,
  calcularSaldoDia,
  calcularPrevisaoSaida,
  formatarSaldo
} from './time-utils';

describe('time-utils', () => {
  describe('paraMinutos', () => {
    it('deve converter HH:MM para minutos', () => {
      expect(paraMinutos('08:00')).toBe(480);
      expect(paraMinutos('12:30')).toBe(750);
      expect(paraMinutos('00:00')).toBe(0);
    });

    it('deve retornar 0 para valores vazios ou nulos', () => {
      expect(paraMinutos(null)).toBe(0);
      expect(paraMinutos(undefined)).toBe(0);
      expect(paraMinutos('')).toBe(0);
    });
  });

  describe('paraHora', () => {
    it('deve converter minutos para HH:MM', () => {
      expect(paraHora(480)).toBe('08:00');
      expect(paraHora(750)).toBe('12:30');
      expect(paraHora(0)).toBe('00:00');
    });

    it('deve lidar com valores negativos', () => {
      expect(paraHora(-60)).toBe('-01:00');
      expect(paraHora(-480)).toBe('-08:00');
    });
  });

  describe('fmtHora', () => {
    it('deve remover segundos de HH:MM:SS', () => {
      expect(fmtHora('08:00:00')).toBe('08:00');
      expect(fmtHora('12:30:15')).toBe('12:30');
    });

    it('deve retornar string vazia para valores nulos', () => {
      expect(fmtHora(null)).toBe('');
    });
  });

  describe('calcularMinutosTrabalhados', () => {
    it('deve calcular corretamente sem intervalo', () => {
      // 08:00 ate 12:00 = 240min
      expect(calcularMinutosTrabalhados('08:00', null, null, '12:00')).toBe(240);
    });

    it('deve calcular corretamente com intervalo completo', () => {
      // 08:00 ate 12:00 (240min) + 13:00 ate 17:00 (240min) = 480min
      expect(calcularMinutosTrabalhados('08:00', '12:00', '13:00', '17:00')).toBe(480);
    });

    it('deve calcular tempo parcial se nao houver saida', () => {
      // 08:00 ate 12:00 (intervalo) = 240min
      expect(calcularMinutosTrabalhados('08:00', '12:00', null, null)).toBe(240);
      // 08:00 ate 12:00 (240min) + 13:00 (retorno) ate "agora" -> mas a funcao usa apenas os campos disponiveis
      // Se houver retorno mas nao saida:
      expect(calcularMinutosTrabalhados('08:00', '12:00', '13:00', null)).toBe(240);
    });

    it('deve retornar 0 se nao houver entrada', () => {
      expect(calcularMinutosTrabalhados(null, null, null, null)).toBe(0);
    });
  });

  describe('calcularSaldoDia', () => {
    it('deve calcular saldo positivo (horas extras)', () => {
      expect(calcularSaldoDia(500, 480)).toBe(20);
    });

    it('deve calcular saldo negativo (atraso)', () => {
      expect(calcularSaldoDia(400, 480)).toBe(-80);
    });

    it('deve calcular saldo zero', () => {
      expect(calcularSaldoDia(480, 480)).toBe(0);
    });
  });

  describe('calcularPrevisaoSaida', () => {
    it('deve prever saida baseada na jornada e intervalo', () => {
      // 08:00 + 08:00 jornada + 01:00 intervalo = 17:00
      expect(calcularPrevisaoSaida('08:00', '12:00', '13:00', '08:00')).toBe('17:00');
    });

    it('deve prever saida sem intervalo registrado', () => {
      // 08:00 + 08:00 jornada = 16:00
      expect(calcularPrevisaoSaida('08:00', null, null, '08:00')).toBe('16:00');
    });

    it('deve retornar null se nao houver entrada', () => {
      expect(calcularPrevisaoSaida(null, null, null, '08:00')).toBe(null);
    });
  });

  describe('formatarSaldo', () => {
    it('deve formatar saldo positivo com sinal +', () => {
      expect(formatarSaldo(60)).toBe('+01:00');
    });

    it('deve formatar saldo negativo com sinal -', () => {
      expect(formatarSaldo(-60)).toBe('-01:00');
    });

    it('deve formatar saldo zero com sinal +', () => {
      expect(formatarSaldo(0)).toBe('+00:00');
    });
  });
});
