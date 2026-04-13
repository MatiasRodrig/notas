# Código Mermaid para Gráficos - Mesa de Entrada

Este archivo contiene el código fuente para generar los diagramas de arquitectura y el modelo de entidad-relación (ERD) utilizando Mermaid.

## 1. Arquitectura de Sistema

```mermaid
graph TD
    %% Estilo Frontend
    subgraph Frontend ["Frontend — React + Vite"]
        direction LR
        F1[Registro vecinos]
        F2[Casos gestión]
        F3[Derivar routing]
        F4[Tracking estados]
        F5[Reportes métricas]
    end

    %% Estilo Backend
    subgraph Backend ["Backend — ASP.NET Core 9"]
        direction TB
        B1[Controllers<br/>REST · minimal API]
        B2[App Layer<br/>CQRS · MediatR]
        B3[Domain<br/>entidades · reglas]
        B4[Infraestructura<br/>EF Core · repos]
        
        B1 --> B2
        B2 --> B3
        B2 --> B4
    end

    %% Estilo Database
    subgraph Database ["SQL Server"]
        DB1[Vecinos · Casos · HistorialEstados]
        DB2[Derivaciones · Areas · Categorias]
        DB3[Adjuntos · Notificaciones · Usuarios · AuditLog]
    end

    %% Conexiones
    Frontend -- "REST · SignalR" --> B1
    B4 -- "EF Core" --> Database

    %% Estilización
    style Frontend fill:#0c447c,stroke:#85b7eb,color:#fff
    style Backend fill:#3c3489,stroke:#afa9ec,color:#fff
    style Database fill:#085041,stroke:#5dc0a5,color:#fff
    style B1 fill:#712b13,stroke:#f0997b,color:#fff
    style B2 fill:#712b13,stroke:#f0997b,color:#fff
    style B3 fill:#712b13,stroke:#f0997b,color:#fff
    style B4 fill:#712b13,stroke:#f0997b,color:#fff
```

---

## 2. Diagrama de Entidad Relación (ERD)

```mermaid
erDiagram
    VECINO ||--o{ CASO : presenta
    CASO }o--|| AREA : "asignado a"
    CASO }o--|| CATEGORIA : "clasificado como"
    CASO ||--o{ HISTORIAL_ESTADO : registra
    CASO ||--o{ DERIVACION : tiene
    CASO ||--o{ ADJUNTO : contiene
    CASO ||--o{ NOTIFICACION : genera
    AREA ||--o{ DERIVACION : recibe

    VECINO {
        uuid Id PK
        string Nombre
        string Dni
        string Telefono
        string Email
        string Direccion
    }
    CASO {
        uuid Id PK
        string NroExpediente
        int Estado
        int Prioridad
        string Descripcion
        uuid VecinoId FK
        uuid AreaId FK
        uuid CategoriaId FK
        uuid UsuarioId FK
        datetime FechaIngreso
    }
    AREA {
        uuid Id PK
        string Nombre
        string Codigo
        uuid ResponsableId FK
    }
    CATEGORIA {
        uuid Id PK
        string Nombre
        string Tipo
        uuid AreaDefaultId FK
    }
    HISTORIAL_ESTADO {
        uuid Id PK
        uuid CasoId FK
        int EstadoAnterior
        int EstadoNuevo
        string Observacion
        uuid UsuarioId FK
        datetime Fecha
    }
    DERIVACION {
        uuid Id PK
        uuid CasoId FK
        uuid AreaOrigenId FK
        uuid AreaDestinoId FK
        string Motivo
        uuid UsuarioId FK
        datetime Fecha
    }
    ADJUNTO {
        uuid Id PK
        uuid CasoId FK
        string NombreArchivo
        string UrlStorage
        string TipoMime
    }
    NOTIFICACION {
        uuid Id PK
        uuid CasoId FK
        uuid UsuarioId FK
        string Message
        bool Leido
        datetime Fecha
    }
```
