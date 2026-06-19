import { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Image as ImageIcon, CheckCircle, Package } from 'lucide-react';
import { submitQuoteRequest } from '../../services/quote-request.service';
import type { QuoteProductContext } from '../../services/quote-request.service';
import { QUOTE_REQUEST, isImageMimeType } from '../../utils/constants';

interface QuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  productContext?: QuoteProductContext;
}

const buildBulkQuoteTemplate = (ctx: QuoteProductContext): string => {
  const priceLine = ctx.price !== undefined ? `Listed Price: ₹${ctx.price}` : '';
  return [
    `Product: ${ctx.productName}`,
    `Part Number: ${ctx.partNumber || 'N/A'}`,
    priceLine,
    '',
    'Required quantity: ',
    'Delivery timeline: ',
    'Additional requirements: ',
  ]
    .filter(Boolean)
    .join('\n');
};

export default function QuoteRequestModal({ isOpen, onClose, productContext }: QuoteRequestModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill message with bulk-quote template whenever the modal is opened
  // with product context. Resets when modal closes / opens for a different product.
  useEffect(() => {
    if (isOpen && productContext) {
      setFormData((prev) => ({
        ...prev,
        message: buildBulkQuoteTemplate(productContext),
      }));
    }
  }, [isOpen, productContext]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type against the central allow-list
      if (!QUOTE_REQUEST.ALLOWED_MIME_TYPES.includes(file.type)) {
        setError(`Please upload a ${QUOTE_REQUEST.ALLOWED_LABEL} file`);
        return;
      }
      // Validate file size
      if (file.size > QUOTE_REQUEST.MAX_FILE_SIZE_BYTES) {
        setError(`File size must be less than ${QUOTE_REQUEST.MAX_FILE_SIZE_MB}MB`);
        return;
      }
      setAttachmentFile(file);
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setAttachmentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!formData.message.trim()) {
      setError('Please enter your message/requirements');
      return;
    }

    setIsSubmitting(true);

    const result = await submitQuoteRequest({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      message: formData.message.trim(),
      attachmentFile: attachmentFile || undefined,
      productContext,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmitSuccess(true);
      // Reset form after delay
      setTimeout(() => {
        setFormData({ name: '', email: '', phone: '', message: '' });
        setAttachmentFile(null);
        setSubmitSuccess(false);
        onClose();
      }, 3000);
    } else {
      setError(result.error || 'Failed to submit request. Please try again.');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ name: '', email: '', phone: '', message: '' });
      setAttachmentFile(null);
      setError(null);
      setSubmitSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  const isBulkQuote = Boolean(productContext);
  const heading = isBulkQuote ? 'Request Bulk Quote' : 'Get a Quote';
  const subheading = isBulkQuote
    ? `Bulk pricing inquiry for ${productContext!.productName}`
    : 'Fill in your details and requirements';

  const attachmentIsImage = attachmentFile ? isImageMimeType(attachmentFile.type) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{heading}</h2>
            <p className="text-sm text-gray-500">{subheading}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {submitSuccess ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Submitted!</h3>
            <p className="text-gray-600">
              Thank you for your interest. We'll get back to you within 24 hours.
            </p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Product context chip (bulk-quote only) */}
            {productContext && (
              <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                <Package className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-primary uppercase tracking-wide">
                    Quote for
                  </p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {productContext.productName}
                  </p>
                  {productContext.partNumber && (
                    <p className="text-xs text-gray-600">
                      Part #: {productContext.partNumber}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                disabled={isSubmitting}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                disabled={isSubmitting}
              />
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your mobile number"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                disabled={isSubmitting}
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                {isBulkQuote ? 'Quantity & Requirements' : 'Requirements/Message'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder={
                  isBulkQuote
                    ? 'Fill in your required quantity, delivery timeline and any additional requirements.'
                    : 'Describe your requirements, quantities, specifications, etc.'
                }
                rows={isBulkQuote ? 8 : 4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition resize-none font-mono text-sm"
                disabled={isSubmitting}
              />
            </div>

            {/* Attachment Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attach File{' '}
                <span className="text-gray-400 text-xs">
                  (Optional - {QUOTE_REQUEST.ALLOWED_LABEL}, max {QUOTE_REQUEST.MAX_FILE_SIZE_MB}MB)
                </span>
              </label>

              {attachmentFile ? (
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    {attachmentIsImage ? (
                      <ImageIcon className="w-8 h-8 text-blue-500" />
                    ) : (
                      <FileText className="w-8 h-8 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {attachmentFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    disabled={isSubmitting}
                    className="text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => !isSubmitting && fileInputRef.current?.click()}
                  className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload a PDF or image
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Drawings, specifications, photos of the part or reference documents
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={QUOTE_REQUEST.ACCEPT_ATTRIBUTE}
                onChange={handleFileChange}
                className="hidden"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              We'll respond to your request within 24 hours
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
