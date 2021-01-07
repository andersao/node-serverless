const { EventHttpRouter } = require('..');

describe('EventHttpRouter', () => {
  test('deve inicializar o router com as rotas vazias', () => {
    const router = new EventHttpRouter();
    const { routes } = router;

    expect(routes).not.toBeUndefined();
    expect(routes).not.toBeNull();
    expect(routes).toStrictEqual({});
  });

  test('não deve permitir registrar uma rota sem um callback', () => {
    const router = new EventHttpRouter();
    expect(() => {
      router.get('/empresas');
    }).toThrowError(/O callback da rota deve ser uma função/);
  });

  test('deve registrar varios metódos para o mesmo path', () => {
    const router = new EventHttpRouter();
    router.get('/empresas', () => {});
    router.post('/empresas', () => {});
    router.put('/empresas', () => {});
    router.delete('/empresas', () => {});

    const { routes } = router;

    const route = routes['/empresas'];

    expect(route).not.toBeUndefined();
    expect(Object.keys(route)).toEqual(['GET', 'POST', 'PUT', 'DELETE']);
  });

  test('deve registrar varios metódos para o mesmo path com o prefixo', () => {
    const router = new EventHttpRouter({ prefix: '/v2' });
    router.get('/empresas', () => {});
    router.post('/empresas', () => {});
    router.put('/empresas', () => {});
    router.delete('/empresas', () => {});

    const { routes } = router;

    expect(routes['/empresas']).toBeUndefined();
    const route = routes['/v2/empresas'];
    expect(route).not.toBeUndefined();
    expect(Object.keys(route)).toEqual(['GET', 'POST', 'PUT', 'DELETE']);
  });

  test('deve registrar apenas uma action para cada metódo por path', () => {
    const router = new EventHttpRouter();
    router.get('/lojas', () => {});
    router.post('/lojas', () => {});
    router.get('/lojas', () => {});

    const { routes } = router;

    const route = routes['/lojas'];
    const routeMethods = Object.keys(route);

    expect(route).not.toBeUndefined();
    expect(routeMethods.length).toEqual(2);
    expect(routeMethods).toEqual(['GET', 'POST']);
  });

  test('deve registrar varios paths', () => {
    const router = new EventHttpRouter();

    const definitions = {
      '/empresas': ['get', 'post'],
      '/empresas/{cnpj}': ['get', 'put', 'delete'],
      '/lojas': ['get', 'post'],
    };

    Object.keys(definitions).forEach((path) => {
      const methods = definitions[path];
      methods.forEach((method) => router[method](path, () => {}));
    });

    const { routes } = router;

    Object.keys(definitions).forEach((path) => {
      const methods = definitions[path].map((m) => m.toUpperCase());
      const route = routes[path];
      const routeMethods = Object.keys(route);

      expect(route).not.toBeUndefined();
      expect(routeMethods.length).toEqual(methods.length);
      expect(routeMethods).toEqual(methods);
    });
  });

  test('deve mesclar três routers em um', () => {
    const router = new EventHttpRouter({ prefix: '/v2' });
    const adminRouter = new EventHttpRouter();
    const lojaRouter = new EventHttpRouter();

    adminRouter.get('/empresas', () => {});
    adminRouter.put('/empresas/{cnpj}', () => {});
    lojaRouter.get('/lojas', () => {});
    router.get('/nfe/lote', () => {});
    router.post('/nfe/emissao', () => {});

    router.merge(adminRouter);
    router.merge(lojaRouter);

    const { routes } = router;

    expect(routes).not.toBeUndefined();
    expect(Object.keys(routes).length).toEqual(5);
  });

  test('deve gerar erro ao tentar mesclar algo diferente de EventHttpRouter', () => {
    const router = new EventHttpRouter({ prefix: '/v2' });
    router.get('/nfe/lote', () => {});
    router.post('/nfe/emissao', () => {});

    expect(() => {
      router.merge({});
    }).toThrow();
    expect(() => {
      router.merge({
        '/admin': {
          GET: () => {},
        },
      });
    }).toThrow();
  });

  test('deve dar o match na rota', () => {
    const router = new EventHttpRouter();
    const routerLojas = new EventHttpRouter({ prefix: 'lojas' });

    routerLojas.get('/', () => {});
    routerLojas.put('/{id}', () => {});

    router.get('/', () => {});
    router.get('/nfe/lote/{id}', () => {});
    router.post('/nfe/lote/{id}', () => {});

    router.get('/nfe/admin/{cnpj}', () => {});
    router.post('/nfe/loja', () => {});
    router.get('/nfe/assinante', () => {});

    router.merge(routerLojas);

    const matched1 = router.matchRoute('POST', '/nfe/admin/42365182000144');
    const matched2 = router.matchRoute('POST', '/nfe/admin');
    const matched3 = router.matchRoute('GET', '/nfe/lote/6d99efda-ba23-48c7-8918-782d397f2aaf');
    const matched4 = router.matchRoute('GET', '/nfe/admin/42365182000144');
    const matched5 = router.matchRoute('GET', '/');
    const matched6 = router.matchRoute('GET', '/lojas');
    const matched7 = router.matchRoute('PUT', '/lojas/123456');

    expect(matched1).toBeNull();
    expect(matched2).toBeNull();

    expect(matched3).not.toBeUndefined();
    expect(matched4).not.toBeUndefined();
    expect(matched5).not.toBeUndefined();
    expect(matched6).not.toBeUndefined();
    expect(matched7).not.toBeUndefined();

    expect(typeof matched3.handler).toEqual('function');
    expect(matched3.resource).toEqual('/nfe/lote/{id}');
    expect(matched3.url).toEqual('/nfe/lote/6d99efda-ba23-48c7-8918-782d397f2aaf');
    expect(matched3.params).toEqual({ id: '6d99efda-ba23-48c7-8918-782d397f2aaf' });

    expect(typeof matched4.handler).toEqual('function');
    expect(matched4.resource).toEqual('/nfe/admin/{cnpj}');
    expect(matched4.url).toEqual('/nfe/admin/42365182000144');
    expect(matched4.params).toEqual({ cnpj: '42365182000144' });

    expect(typeof matched5.handler).toEqual('function');
    expect(matched5.resource).toEqual('/');
    expect(matched5.url).toEqual('/');
    expect(matched5.params).toEqual({});

    expect(typeof matched6.handler).toEqual('function');
    expect(matched6.resource).toEqual('/lojas');
    expect(matched6.url).toEqual('/lojas');
    expect(matched6.params).toEqual({});

    expect(typeof matched7.handler).toEqual('function');
    expect(matched7.resource).toEqual('/lojas/{id}');
    expect(matched7.url).toEqual('/lojas/123456');
    expect(matched7.params).toEqual({ id: '123456' });
  });
});
