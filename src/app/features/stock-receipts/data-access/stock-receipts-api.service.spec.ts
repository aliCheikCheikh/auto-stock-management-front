import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StockReceiptsApiService } from './stock-receipts-api.service';

describe('StockReceiptsApiService import CSV', () => {
  let service: StockReceiptsApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StockReceiptsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('télécharge le modèle comme un fichier binaire', () => {
    const template = new Blob(['reference;nom_produit\n'], { type: 'text/csv' });

    service.downloadImportTemplate().subscribe((response) => expect(response).toBe(template));

    const request = httpTesting.expectOne('/api/v1/stock-receipts/import-template');
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(template);
  });

  it('envoie le fichier et le magasin pour la prévisualisation', () => {
    const file = csvFile();

    service.previewImport(file, 'shop-1').subscribe();

    const request = httpTesting.expectOne('/api/v1/stock-receipts/import-preview');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.has('Content-Type')).toBeFalse();
    const body = request.request.body as FormData;
    expect(body.get('file')).toBe(file);
    expect(body.get('shopId')).toBe('shop-1');
    request.flush({ rows: [], summary: emptyPreviewSummary() });
  });

  it('envoie une sélection triée avec un identifiant d’import', () => {
    const file = csvFile();

    service.executeImport(file, 'shop-1', 'import-1', new Set([8, 2, 5])).subscribe();

    const request = httpTesting.expectOne('/api/v1/stock-receipts/import-executions');
    expect(request.request.method).toBe('POST');
    const body = request.request.body as FormData;
    expect(body.get('file')).toBe(file);
    expect(body.get('shopId')).toBe('shop-1');
    expect(body.get('importId')).toBe('import-1');
    expect(body.getAll('selectedLineNumbers')).toEqual(['2', '5', '8']);
    request.flush({
      importId: 'import-1',
      rows: [],
      summary: {
        totalRows: 0,
        selectedRows: 0,
        importedRows: 0,
        productsCreated: 0,
        existingProductsReceived: 0,
        ignoredInvalidRows: 0,
        ignoredByUserRows: 0,
        failedRows: 0,
        totalQuantityReceived: 0,
      },
    });
  });

  function csvFile(): File {
    return new File(['reference;nom_produit\nREF-1;Filtre\n'], 'produits.csv', {
      type: 'text/csv',
    });
  }

  function emptyPreviewSummary() {
    return {
      totalRows: 0,
      productsToCreate: 0,
      existingProductsToReceive: 0,
      invalidRows: 0,
    };
  }
});
