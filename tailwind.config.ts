import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			light: '#FAFAFA',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			secondarydark: '#604B30',
  			dark: '#000000',
  			darkgray: '#1A1A1A',
  			gray: '#7A7474',
  			isabelline: '#EDF1F5',
  			link: '#95754B',
  			beige: '#dfd1bf',
  			lightblack: '#463723',
  			lightSalmon: '#e99874',
  			lightCream: '#efe8de',
  			whiteSmoke: '#fafafa',
  			softwhite: '#FBFAF9',
  			warmbeige: '#EFE8DF',
  			darkchocolate: '#463723',
  			softbeige: '#C2AE95',
  			lightsand: '#E2D5C5',
  			taupebrown: '#988667',
  			sandy: '#c7af90',
  			whisperwhite: '#f5f5f5',
  			softgray: '#f0eeee',
  			darkbrown: '#69491F',
  			seashell: '#F5F1ED',
  			beigemuted: '#D4CDBB',
  			brightcyan: '#19DFEC',
  			birch: '#332E24',
  			coolblue: '#90B2BF',
  			vanilla: '#F0E8CB',
  			slateblue: '#18414D',
  			bluish: '#163B46',
  			bluishlight: '#235561',
  			ivorytint: '#EDEAE1',
  			subtlesand: '#F4F2EC',
  			tealhaze: '#6191A3',
  			darkbluish: '#18434E',
  			spandark: '#B6572E',
  			orange: '#E5855C',
  			oceanblue: '#16596D',
  			lightsky: '#E9F1F5',
  			mutedgray: '#E6EAEC',
  			palesand: '#ECE6DE',
  			cloudysky: '#EDF4F5',
  			darkolive: '#554734',
  			palebrown: '#D5C2AA',
  			midnightblack: '#0F1819',
  			lightcloud: '#F1F5F6',
  			coolmist: '#A6C7CF',
  			darkcyan: '#2F778C',
  			softalmond: '#F3EFEB',
  			peachcream: '#F8F1EA',
  			palewood: '#D6C4AF',
  			antiquesand: '#D3C4B0',
  			bColor: '#EDE2D7',
  			darkcadet: '#254E5A',
  			lightblueshade: '#E8F3F8',
  			lightblueshade400: '#D3E9F1',
  			darkblue: '#090B14',
  			electricblue: '#586F76',
  			stormyblue: '#173C47',
  			errorRed: '#B42318',
  			successGreen: '#1D8348',
  			cloudgray: '#F0F0F5',
  			charcoal: '#26262A',
  			lightsmoke: '#D9D9D9',
  			lavendergray: '#ADABC3',
  			mutedpurple: '#8D8BA7',
  			bloodred: '#A00707',
  			slatedark: '#4c4c4c',
  			neutralgray: '#efefef',
  			greenShadesLight: '#08555c',
  			'greenShadesLight-dark': 'rgba(8, 85, 92, 0.3)',
  			darkSection: '#01171D',
  			tealblur: '#0C7077',
  			heroBackground: '#154652',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			proxima: [
  				'Proxima',
  				'sans-serif'
  			],
  			libre: [
  				'Libre',
  				'serif'
  			],
  			helvetica: [
  				'Helvetica',
  				'sans-serif'
  			],
  			arial: [
  				'Arial',
  				'sans-serif'
  			],
  			dmsans: [
  				'DMSans',
  				'sans-serif'
  			],
  			dmseriftext: [
  				'DMSerifText',
  				'serif'
  			],
  			roboto: [
  				'Roboto',
  				'sans-serif'
  			],
  			shippori: [
  				'Shippori',
  				'serif'
  			]
  		},
  		container: {
  			center: true,
  			padding: {
  				DEFAULT: '1.25rem'
  			},
  			screens: {
  				container: '1830px'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

