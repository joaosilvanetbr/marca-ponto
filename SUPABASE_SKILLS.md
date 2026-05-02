# Supabase Agent Skills

## Para usar com MCP (Claude Desktop / Cursor)

### 1. Instalar MCP Server do Supabase

```bash
# Opcao A: Postgres MCP Server (acesso direto ao banco)
npm install -g @modelcontextprotocol/server-postgres

# Opcao B: Supabase CLI (acesso via API)
npm install -g supabase
```

### 2. Configurar MCP

Edite o arquivo `.cursor/mcp.json` ou `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "supabase-postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:SUA_SENHA@db.xllstygjaavytitvrfrz.supabase.co:5432/postgres"
      ]
    }
  }
}
```

**Substitua `SUA_SENHA` pela senha do banco** (encontrada em: Supabase Dashboard → Settings → Database → Connection string → URI).

### 3. Usar no Cursor IDE

Com o MCP configurado, você pode perguntar no chat:
- "Liste todos os registros de ponto de maio"
- "Qual o saldo de horas do usuario?"
- "Mostre os dias sem registro neste mes"

---

## Skill Local (sem MCP)

O arquivo `src/lib/supabase-skill.ts` já está no projeto. Use no código:

```typescript
import { estatisticasMes, resumoDia, exportarDados } from '@/lib/supabase-skill';

// Estatisticas do mes
const stats = await estatisticasMes('2026-05');
console.log(stats.horasTrabalhadas); // "160h 30m"
console.log(stats.saldoFormatado);   // "+2h 15m"

// Resumo de um dia especifico
const dia = await resumoDia('2026-05-03');
console.log(dia.mensagem);

// Backup JSON
const backup = await exportarDados();
```

---

## Connection String (para referencia)

```
postgresql://postgres:[SUA_SENHA]@db.xllstygjaavytitvrfrz.supabase.co:5432/postgres
```

**Host:** db.xllstygjaavytitvrfrz.supabase.co  
**Port:** 5432  
**Database:** postgres  
**User:** postgres  
**Password:** *(obter em Supabase Dashboard → Settings → Database)*
