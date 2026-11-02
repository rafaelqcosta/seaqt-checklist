import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Moon,
  Snowflake,
  Sun,
  type LucideProps,
} from 'lucide-react'
import type { TipoIconeTempo } from '../lib/meteo'

const ICONES: Record<TipoIconeTempo, React.ComponentType<LucideProps>> = {
  sol: Sun,
  lua: Moon,
  'sol-nuvem': CloudSun,
  'lua-nuvem': CloudMoon,
  nuvem: Cloud,
  nevoeiro: CloudFog,
  garoa: CloudDrizzle,
  chuva: CloudRain,
  trovoada: CloudLightning,
  neve: Snowflake,
}

export function IconeTempo({ tipo, ...props }: { tipo: TipoIconeTempo } & LucideProps) {
  const Icone = ICONES[tipo]
  return <Icone {...props} />
}
