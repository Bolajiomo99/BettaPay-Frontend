import React from 'react';
import { render, screen } from '@testing-library/react';
import { useUploadKybDocument } from '@/lib/kyc/api';
import type { KybDocTypeMeta } from '@/lib/kyc/types';
import { KybDocumentRow } from '../KybDocumentRow';

jest.mock('@/lib/kyc/api', () => ({
  useUploadKybDocument: jest.fn(() => ({
    upload: jest.fn(),
    isUploading: false,
    progress: 0,
    activeType: null,
    error: null,
    reset: jest.fn(),
  })),
}));

jest.mock('@/lib/kyc/validation', () => ({
  fileInputAccept: () => '.pdf,.jpg,.jpeg,.png',
  formatBytes: (bytes: number) => `${bytes} B`,
  isImageMime: (type: string) => type.startsWith('image/'),
  validateKybFile: jest.fn(() => null),
}));

jest.mock('../KybStatusBadge', () => ({
  KybDocStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

const defaultMeta: KybDocTypeMeta = {
  type: 'certificate_of_incorporation',
  label: 'Certificate of Incorporation',
  hint: 'Upload your certificate',
  required: true,
};

describe('KybDocumentRow', () => {
  it('renders the document label', () => {
    render(
      <KybDocumentRow
        merchantId="m1"
        meta={defaultMeta}
        document={null}
      />
    );
    expect(screen.getByText('Certificate of Incorporation')).toBeInTheDocument();
  });

  it('shows server error when upload fails', async () => {
    const mockUpload = jest.fn().mockRejectedValue(new Error('Payload Too Large'));
    jest.mocked(useUploadKybDocument).mockReturnValue({
      upload: mockUpload,
      isUploading: false,
      progress: 0,
      activeType: null,
      error: 'Payload Too Large',
      reset: jest.fn(),
    });

    render(
      <KybDocumentRow
        merchantId="m1"
        meta={defaultMeta}
        document={null}
      />
    );

    expect(screen.getByText('Payload Too Large')).toBeInTheDocument();
  });

  it('shows upload progress when uploading', () => {
    jest.mocked(useUploadKybDocument).mockReturnValue({
      upload: jest.fn(),
      isUploading: true,
      progress: 50,
      activeType: 'certificate_of_incorporation',
      error: null,
      reset: jest.fn(),
    });

    render(
      <KybDocumentRow
        merchantId="m1"
        meta={defaultMeta}
        document={null}
      />
    );

    expect(screen.getByText(/Uploading/)).toBeInTheDocument();
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it('shows upload button when no document exists', () => {
    render(
      <KybDocumentRow
        merchantId="m1"
        meta={defaultMeta}
        document={null}
      />
    );

    expect(screen.getByText('Upload')).toBeInTheDocument();
  });
});
