# Guía de Uso del Componente Button

## ✅ Uso Correcto

### Botón con icono a la izquierda

```jsx
<Button leftIcon={<Icon className="w-4 h-4" />}>Texto del botón</Button>
```

### Botón con icono a la derecha

```jsx
<Button rightIcon={<Icon className="w-4 h-4" />}>Texto del botón</Button>
```

### Botón con estado de carga

```jsx
<Button
  loading={isPending}
  leftIcon={!isPending && <Icon className="w-4 h-4" />}
>
  {isPending ? "Cargando..." : "Acción"}
</Button>
```

### Botón con icono condicional

```jsx
<Button
  leftIcon={
    isActive ? (
      <CheckIcon className="w-4 h-4" />
    ) : (
      <PlusIcon className="w-4 h-4" />
    )
  }
>
  {isActive ? "Activo" : "Activar"}
</Button>
```

### Botón solo icono (sin texto)

```jsx
<Button size="icon" variant="ghost">
  <Icon className="w-5 h-5" />
</Button>
```

## ❌ USO INCORRECTO

### ⛔ NO uses `mr-2`, `ml-2`, etc. en los iconos

```jsx
// ❌ INCORRECTO - El icono y texto pueden quebrarse
<Button>
  <Icon className="w-4 h-4 mr-2" />
  Texto
</Button>

// ✅ CORRECTO
<Button leftIcon={<Icon className="w-4 h-4" />}>
  Texto
</Button>
```

### ⛔ NO pongas el icono como hijo directo del Button (excepto botones solo-icono)

```jsx
// ❌ INCORRECTO
<Button>
  <Icon className="w-4 h-4" />
  <span>Texto</span>
</Button>

// ✅ CORRECTO
<Button leftIcon={<Icon className="w-4 h-4" />}>
  Texto
</Button>
```

### ⛔ NO uses fragmentos innecesarios con iconos

```jsx
// ❌ INCORRECTO
<Button>
  <>
    <Icon className="w-4 h-4 mr-2" />
    Texto
  </>
</Button>

// ✅ CORRECTO
<Button leftIcon={<Icon className="w-4 h-4" />}>
  Texto
</Button>
```

## 📦 Props Disponibles

| Prop        | Tipo      | Valores                                                      | Descripción                    |
| ----------- | --------- | ------------------------------------------------------------ | ------------------------------ |
| `variant`   | string    | `primary`, `secondary`, `soft`, `ghost`, `outline`, `danger` | Estilo del botón               |
| `size`      | string    | `xs`, `sm`, `md`, `lg`, `xl`, `icon`                         | Tamaño del botón               |
| `leftIcon`  | ReactNode | Componente de icono                                          | Icono a la izquierda del texto |
| `rightIcon` | ReactNode | Componente de icono                                          | Icono a la derecha del texto   |
| `loading`   | boolean   | true/false                                                   | Muestra spinner de carga       |
| `disabled`  | boolean   | true/false                                                   | Deshabilita el botón           |
| `className` | string    | Clases CSS                                                   | Clases adicionales             |

## 🎯 Tamaños de Iconos Recomendados

- **`xs`, `sm`**: `w-4 h-4`
- **`md`, `lg`, `xl`**: `w-4 h-4` o `w-5 h-5`
- **`icon`**: `w-5 h-5` o `w-6 h-6`

## 🔧 El Componente Automáticamente:

1. ✅ Alinea el icono y el texto horizontalmente
2. ✅ Aplica el espaciado correcto (`gap-2`)
3. ✅ Previene que el texto y el icono se "quiebren"
4. ✅ Maneja estados de carga automáticamente
5. ✅ Es responsivo y accesible

## 💡 Consejos

- Siempre usa las props `leftIcon` o `rightIcon` para iconos con texto
- No agregues márgenes manualmente (`mr-2`, `ml-2`) a los iconos
- El componente ya tiene `gap-2` para espaciado perfecto
- Para botones solo-icono, usa `size="icon"` y pon el icono como children
