import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import { Layout, Row, Col, Card, Typography, Button, Tag, Skeleton, Result, Space } from 'antd';
import { FaChevronLeft } from 'react-icons/fa';

const { Content } = Layout;
const { Title, Text } = Typography;

const TemplateDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTemplate = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await axios.get(`${API_BASE}/templates/${id}`);
                setTemplate(data);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Product not found');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchTemplate();
    }, [id]);

    if (loading) {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Content style={{ padding: '40px 16px' }}>
                    <div className="max-w-5xl mx-auto">
                        <Skeleton active avatar paragraph={{ rows: 6 }} />
                    </div>
                </Content>
            </Layout>
        );
    }

    if (error || !template) {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Content style={{ padding: '40px 16px' }}>
                    <Result
                        status="404"
                        title="Product not found"
                        subTitle={error || 'The product you are looking for does not exist.'}
                        extra={
                            <Link to="/">
                                <Button type="primary">Back to Home</Button>
                            </Link>
                        }
                    />
                </Content>
            </Layout>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <Content style={{ padding: '24px 16px 48px' }}>
                <div className="max-w-5xl mx-auto">
                    <Button
                        type="link"
                        icon={<FaChevronLeft />}
                        onClick={() => navigate(-1)}
                        style={{ paddingLeft: 0, marginBottom: 16 }}
                    >
                        Back
                    </Button>

                    <Card bordered={false} style={{ borderRadius: 16 }}>
                        <Row gutter={[32, 32]} align="top">
                            {/* Left: Sample Preview */}
                            <Col xs={24} md={12}>
                                <Title level={4}>Sample Preview</Title>
                                <Card
                                    bordered
                                    style={{ borderRadius: 16, marginTop: 8 }}
                                    bodyStyle={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}
                                >
                                    <img
                                        src={template.demoImageUrl || template.previewImage || template.backgroundImageUrl}
                                        alt={template.name}
                                        style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/500x500/f8fafc/6366f1?text=' + template.name.replace(/ /g, '+');
                                        }}
                                    />
                                </Card>
                                <Text type="secondary" style={{ display: 'block', marginTop: 12, textAlign: 'center', fontStyle: 'italic' }}>
                                    This is how your design will look when you upload your photo.
                                </Text>
                            </Col>

                            {/* Right: Product Details */}
                            <Col xs={24} md={12}>
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                    <div>
                                        <Title level={3} style={{ marginBottom: 4 }}>{template.name}</Title>
                                        <Space size="small">
                                            <Tag color="blue">{template.category}</Tag>
                                            {template.brand && <Tag>{template.brand}</Tag>}
                                        </Space>
                                    </div>

                                    <Card bordered style={{ borderRadius: 16 }}>
                                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                                            <div className="flex justify-between items-center">
                                                <Text strong>Price</Text>
                                                <Title level={3} style={{ margin: 0, color: '#16a34a' }}>
                                                    ₹{template.basePrice}
                                                </Title>
                                            </div>
                                            {template.modelName && (
                                                <div className="flex justify-between items-center">
                                                    <Text type="secondary">Model</Text>
                                                    <Text>{template.modelName}</Text>
                                                </div>
                                            )}
                                            {template.caseType && template.caseType !== 'None' && (
                                                <div className="flex justify-between items-center">
                                                    <Text type="secondary">Case Type</Text>
                                                    <Text>{template.caseType}</Text>
                                                </div>
                                            )}
                                            {template.variantNo && (
                                                <div className="flex justify-between items-center">
                                                    <Text type="secondary">Variant No</Text>
                                                    <Text>{template.variantNo}</Text>
                                                </div>
                                            )}
                                            {template.productSize && (
                                                <div className="flex justify-between items-center">
                                                    <Text type="secondary">Product Size</Text>
                                                    <Text>{template.productSize}</Text>
                                                </div>
                                            )}
                                            {template.printSize && (
                                                <div className="flex justify-between items-center">
                                                    <Text type="secondary">Print Size</Text>
                                                    <Text>{template.printSize}</Text>
                                                </div>
                                            )}
                                            {template.moq != null && (
                                                <div className="flex justify-between items-center">
                                                    <Text type="secondary">MOQ</Text>
                                                    <Text>{template.moq}</Text>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center bg-indigo-50/50 p-2 rounded-lg mt-2">
                                                <Text type="secondary" className="text-indigo-600 font-bold uppercase tracking-tighter text-[10px]">Packing Charges</Text>
                                                <Text strong className={template.packingCharges > 0 ? 'text-gray-800' : 'text-green-600'}>
                                                    {template.packingCharges > 0 ? `₹${template.packingCharges}` : 'FREE'}
                                                </Text>
                                            </div>
                                            <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg">
                                                <Text type="secondary" className="text-blue-600 font-bold uppercase tracking-tighter text-[10px]">Shipping Fee</Text>
                                                <Text strong className={template.shippingCharges > 0 ? 'text-gray-800' : 'text-green-600'}>
                                                    {template.shippingCharges > 0 ? `₹${template.shippingCharges}` : 'FREE DELIVERY'}
                                                </Text>
                                            </div>
                                        </Space>
                                    </Card>

                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Button
                                            type="primary"
                                            size="large"
                                            block
                                            onClick={() => navigate(`/customize/${template._id}`)}
                                        >
                                            Customize Now
                                        </Button>
                                        <Link to={`/category/${template.category}`}>
                                            <Button block>
                                                View more in {template.category}
                                            </Button>
                                        </Link>
                                    </Space>
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </div>
            </Content>
        </Layout>
    );
};

export default TemplateDetails;
